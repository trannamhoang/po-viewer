import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# Khi chạy local mà chưa có DATABASE_URL,
# ứng dụng tiếp tục dùng SQLite.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./po_viewer.db",
)

# Render cung cấp URL dạng postgresql://.
# Ta chỉ rõ driver psycopg cho SQLAlchemy.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1,
    )


engine_options = {
    "pool_pre_ping": True,
}

# SQLite cần cấu hình riêng khi chạy local.
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {
        "check_same_thread": False,
    }


engine = create_engine(
    DATABASE_URL,
    **engine_options,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


Base = declarative_base()


def get_database():
    database = SessionLocal()

    try:
        yield database
    finally:
        database.close()