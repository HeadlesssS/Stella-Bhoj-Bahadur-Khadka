from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserInfoView, LogoutView, ChatView,
    ProfileView, UserPostsView, UserSavedStarsView,
    SaveStarView, StarPostsView,
    PostListCreateView, PostDeleteView, LikeToggleView,
    CommentListCreateView, CommentDeleteView,
    TrendingStarsView, FeedView, StatsView,
    AstronomicalEventListView,
)

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('user/', UserInfoView.as_view(), name='user-info'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # AI Chat
    path('chat/', ChatView.as_view(), name='chat'),

    # Profile
    path('profile/<str:username>/', ProfileView.as_view(), name='profile'),
    path('profile/<str:username>/posts/', UserPostsView.as_view(), name='user-posts'),
    path('profile/<str:username>/saved-stars/', UserSavedStarsView.as_view(), name='user-saved-stars'),

    # Stars
    path('stars/<str:star_id>/save/', SaveStarView.as_view(), name='save-star'),
    path('stars/<str:star_id>/posts/', StarPostsView.as_view(), name='star-posts'),

    # Posts
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:id>/', PostDeleteView.as_view(), name='post-delete'),
    path('posts/<int:pk>/like/', LikeToggleView.as_view(), name='post-like'),
    path('posts/<int:pk>/comments/', CommentListCreateView.as_view(), name='post-comments'),

    # Comments
    path('comments/<int:pk>/', CommentDeleteView.as_view(), name='comment-delete'),

    # Discovery
    path('trending-stars/', TrendingStarsView.as_view(), name='trending-stars'),
    path('feed/', FeedView.as_view(), name='feed'),
    path('stats/', StatsView.as_view(), name='stats'),

    # Astronomical Events
    path('events/', AstronomicalEventListView.as_view(), name='events'),
]

