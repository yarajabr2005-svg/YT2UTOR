from django.urls import path
from apps.ai.views import AIRecommendView

urlpatterns = [
    path("ai/recommend/", AIRecommendView.as_view(), name="ai-recommend"),
]
