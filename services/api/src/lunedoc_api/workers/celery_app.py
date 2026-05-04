"""Celery app + beat schedule.

Run a worker with:
  celery -A lunedoc_api.workers.celery_app worker --loglevel=info

Run beat (single instance) with:
  celery -A lunedoc_api.workers.celery_app beat --loglevel=info
"""
from __future__ import annotations

from celery import Celery

from ..settings import get_settings

celery_app = Celery(
    "lunedoc",
    broker=get_settings().REDIS_URL,
    backend=get_settings().REDIS_URL,
    include=["lunedoc_api.workers.sweeper"],
)

celery_app.conf.update(
    task_default_queue="default",
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "sweep-expired-files": {
            "task": "lunedoc.sweep_expired_files",
            "schedule": 60.0,  # seconds
        },
    },
)
