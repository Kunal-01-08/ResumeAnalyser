import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

import requests


logger = logging.getLogger(__name__)


def email_is_configured() -> bool:
    has_sender = bool(os.getenv("SMTP_FROM"))
    has_brevo_api = bool(os.getenv("BREVO_API_KEY"))
    has_smtp = bool(os.getenv("SMTP_HOST"))
    return has_sender and (has_brevo_api or has_smtp)


def send_with_brevo_api(message: EmailMessage, api_key: str) -> None:
    """Send through Brevo's HTTPS API, avoiding blocked SMTP ports on Render."""
    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json",
        },
        json={
            "sender": {"email": os.environ["SMTP_FROM"]},
            "to": [{"email": str(message["To"])}],
            "subject": str(message["Subject"]),
            "textContent": message.get_body(preferencelist=("plain",)).get_content(),
        },
        timeout=15,
    )
    response.raise_for_status()


def send_email(message: EmailMessage) -> None:
    """Deliver a prepared email through the configured SMTP provider."""
    if not email_is_configured():
        raise RuntimeError("Email delivery is not configured")

    brevo_api_key = os.getenv("BREVO_API_KEY")
    if brevo_api_key:
        try:
            send_with_brevo_api(message, brevo_api_key)
            return
        except requests.RequestException as error:
            logger.exception("Brevo API email delivery failed: %s", error)
            raise

    host = os.environ["SMTP_HOST"]
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
    tls_context = ssl.create_default_context()

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(
                host, port, timeout=15, context=tls_context
            ) as server:
                server.ehlo()
                if username and password:
                    server.login(username, password)
                server.send_message(message)
            return

        with smtplib.SMTP(host, port, timeout=15) as server:
            server.ehlo()
            server.starttls(context=tls_context)
            server.ehlo()
            if username and password:
                server.login(username, password)
            server.send_message(message)
    except (OSError, smtplib.SMTPException, ValueError) as error:
        logger.exception(
            "SMTP delivery failed (host=%s, port=%s, ssl=%s): %s",
            host,
            port,
            use_ssl,
            error,
        )
        raise


def send_password_reset_email(recipient: str, reset_url: str) -> None:
    """Send a password-reset link using the configured SMTP provider."""
    message = EmailMessage()
    message["Subject"] = "Reset your ResumeAnalyser password"
    message["From"] = os.environ["SMTP_FROM"]
    message["To"] = recipient
    message.set_content(
        "We received a request to reset your password.\n\n"
        f"Reset your password: {reset_url}\n\n"
        "This link expires in 15 minutes. If you did not request it, you can ignore this email."
    )
    send_email(message)


def send_email_verification_email(recipient: str, verification_url: str) -> None:
    """Send an account-verification link after signup."""
    message = EmailMessage()
    message["Subject"] = "Verify your ResumeAnalyser email"
    message["From"] = os.environ["SMTP_FROM"]
    message["To"] = recipient
    message.set_content(
        "Thanks for creating a ResumeAnalyser account.\n\n"
        f"Verify your email: {verification_url}\n\n"
        "This link expires in 15 minutes. If you did not create this account, you can ignore this email."
    )
    send_email(message)
