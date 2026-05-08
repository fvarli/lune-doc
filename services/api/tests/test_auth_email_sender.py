"""EmailSender abstraction — Console + Capturing backends."""
from __future__ import annotations

import logging

import pytest

from lunedoc_api.auth.email import (
    CapturingEmailSender,
    ConsoleEmailSender,
    EmailMessage,
    make_email_sender,
)


@pytest.mark.asyncio
async def test_console_sender_logs_message(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.WARNING, logger="lunedoc.auth.email")
    sender = ConsoleEmailSender()
    msg = EmailMessage(
        to="user@example.com",
        subject="Sign in to lune-doc",
        body_text="Your code: 123456",
    )
    await sender.send(msg)
    assert "user@example.com" in caplog.text
    assert "Sign in to lune-doc" in caplog.text
    assert "123456" in caplog.text


@pytest.mark.asyncio
async def test_capturing_sender_records_messages() -> None:
    sender = CapturingEmailSender()
    await sender.send(EmailMessage(to="a@x", subject="s1", body_text="b1"))
    await sender.send(EmailMessage(to="b@x", subject="s2", body_text="b2"))
    assert len(sender.messages) == 2
    assert sender.last.subject == "s2"


def test_capturing_sender_last_raises_when_empty() -> None:
    sender = CapturingEmailSender()
    with pytest.raises(AssertionError):
        _ = sender.last


def test_factory_returns_console_for_default_setting() -> None:
    sender = make_email_sender()
    assert isinstance(sender, ConsoleEmailSender)
