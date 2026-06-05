from rq import Queue
from redis import Redis

from app.config import get_settings

settings = get_settings()

redis_connection = Redis.from_url(settings.redis_url)
smart_ingest_queue = Queue("smart_ingest", connection=redis_connection)


def enqueue_smart_ingest_job(
    job_id: str,
    saved_file: dict,
    theme_id: str,
    chunk_size: int,
    chunk_overlap: int,
    batch_size: int,
):
    return smart_ingest_queue.enqueue(
        "app.workers.smart_ingest_worker.run_smart_ingest_job",
        job_id,
        saved_file,
        theme_id,
        chunk_size,
        chunk_overlap,
        batch_size,
        job_timeout=60 * 60,
    )
