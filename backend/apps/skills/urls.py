from django.urls import path

from .views import (
    AddTutorSkillsView,
    UploadQualificationView,
    DeleteQualificationView,
    PendingQualificationsView,
    QualificationVerifyView,
    SearchTutorsView,
    TutorPublicProfileView,
    SkillListView,   # ⭐️ NEW
)

urlpatterns = [
    # ⭐️ NEW — Predefined Skills Catalog
    path("skills/", SkillListView.as_view(), name="skill-list"),

    path("tutors/skills/", AddTutorSkillsView.as_view(), name="tutor-skills"),

    path("search/", SearchTutorsView.as_view(), name="search-tutors"),

    path("tutors/<uuid:tutor_id>/", TutorPublicProfileView.as_view(), name="tutor-public-profile"),

    path("qualifications/", UploadQualificationView.as_view(), name="upload-qualification"),
    path("qualifications/<int:qual_id>/", DeleteQualificationView.as_view(), name="delete-qualification"),

    path("qualifications/pending/", PendingQualificationsView.as_view(), name="pending-qualifications"),
    path("qualifications/<int:qual_id>/verify/", QualificationVerifyView.as_view(), name="verify-qualification"),
]