from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_name = Column(String(255), nullable=False)
    hcp_specialty = Column(String(255))
    hcp_location = Column(String(255))
    interaction_type = Column(Enum("in-person", "phone", "email", "virtual", name="interaction_type_enum"), default="in-person")
    interaction_date = Column(DateTime, default=datetime.utcnow)
    products_discussed = Column(Text)
    notes = Column(Text)
    summary = Column(Text)
    sentiment = Column(Enum("positive", "neutral", "negative", name="sentiment_enum"), default="neutral")
    follow_up_required = Column(String(10), default="No")
    follow_up_notes = Column(Text)
    rep_name = Column(String(255), default="Field Rep")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
