import enum


class UserRole(enum.StrEnum):
    student = "student"
    teacher = "teacher"


class MeetingStatus(enum.StrEnum):
    scheduled = "scheduled"
    live = "live"
    ended = "ended"


class GameStatus(enum.StrEnum):
    completed = "completed"
    abandoned = "abandoned"
    timed_out = "timed_out"
