import os
import smtplib
from email.message import EmailMessage


def email_is_configured() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_FROM"))


def send_email(message: EmailMessage) -> None:
    """Deliver a prepared email through the configured SMTP provider."""
    if not email_is_configured():
        raise RuntimeError("Email delivery is not configured")

    host = os.environ["SMTP_HOST"]
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() == "true"

    if use_ssl:
        with smtplib.SMTP_SSL(host, port, timeout=15) as server:
            if username and password:
                server.login(username, password)
            server.send_message(message)
        return

    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        if username and password:
            server.login(username, password)
        server.send_message(message)


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
