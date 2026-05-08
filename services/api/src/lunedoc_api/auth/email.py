"""Email delivery — pluggable backend with a console default.

Step 1 ships only `ConsoleEmailSender` (logs to stdout). Tests use
`CapturingEmailSender` to make structural assertions (last subject,
last code, etc.) instead of grepping logs. Real SMTP / HTTP
providers will land as additional `EMAIL_BACKEND` values later.

The Protocol shape is intentionally small — `send(message)` only.
Anything richer (templates, async batching) belongs in a higher
layer once we actually need it.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Protocol

from ..settings import get_settings

_log = logging.getLogger("lunedoc.auth.email")


@dataclass(frozen=True)
class EmailMessage:
    """A single outgoing email. Plain-text + optional HTML."""

    to: str
    subject: str
    body_text: str
    body_html: str | None = None


class EmailSender(Protocol):
    async def send(self, message: EmailMessage) -> None: ...


class ConsoleEmailSender:
    """Logs the message to stdout. The Step 1 default.

    Format is intentionally readable so a human running the dev
    server can paste the link or code into a curl call without
    parsing.
    """

    async def send(self, message: EmailMessage) -> None:
        _log.warning(
            "\n"
            "===== email (console) =====\n"
            "to:      %s\n"
            "subject: %s\n"
            "---\n"
            "%s\n"
            "===========================",
            message.to,
            message.subject,
            message.body_text,
        )


class CapturingEmailSender:
    """In-memory sender for tests. Stores every message it received.

    Tests grab it via `app.dependency_overrides` or by replacing the
    module-level singleton, then read `messages[-1]` to assert on the
    most recent send.
    """

    def __init__(self) -> None:
        self.messages: list[EmailMessage] = []

    async def send(self, message: EmailMessage) -> None:
        self.messages.append(message)

    @property
    def last(self) -> EmailMessage:
        if not self.messages:
            raise AssertionError("no email captured")
        return self.messages[-1]


def make_email_sender() -> EmailSender:
    """Resolve the configured backend.

    Currently `EMAIL_BACKEND` is `Literal["console"]`, so this is a
    one-branch switch. Adding "smtp" or "resend" later means another
    branch and another class.
    """
    backend = get_settings().EMAIL_BACKEND
    if backend == "console":
        return ConsoleEmailSender()
    raise RuntimeError(f"unknown EMAIL_BACKEND: {backend!r}")  # pragma: no cover
