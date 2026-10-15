from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from .models import UserProfile, SavedStar, Post, Like, Comment, AstronomicalEvent
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    UserProfileSerializer, SavedStarSerializer,
    PostSerializer, CommentSerializer,
    AstronomicalEventSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if user is None:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })


class UserInfoView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
            return Response({'message': 'Successfully logged out'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


from groq import Groq
from decouple import config

_groq_client = Groq(api_key=config('GROQ_API_KEY', default='missing'))

class ChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_msg = request.data.get('message')
        star = request.data.get('star', {})
        system_prompt = (
            "You are a helpful astronomical guide called Stella.\n"
            f"The user is currently viewing this star:\n"
            f"- Name: {star.get('name', 'Unknown')}\n"
            f"- B-V Color Index: {star.get('bv', 'N/A')}\n"
            f"- Visual Magnitude: {star.get('vmag', 'N/A')}\n"
            f"- Distance: {star.get('distance', 'N/A')} parsecs\n"
            f"- RA: {star.get('ra', 'N/A')}\n"
            f"- Dec: {star.get('dec', 'N/A')}\n"
            "Answer questions about this star and astronomy in general."
        )
        chat_completion = _groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg},
            ],
            model="llama-3.3-70b-versatile",
        )
        return Response({'reply': chat_completion.choices[0].message.content})


class PostPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class ProfileView(APIView):
    def get_permissions(self):
        if self.request.method == 'PUT':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return Response(UserProfileSerializer(profile, context={'request': request}).data)

    def put(self, request, username):
        if request.user.username != username:
            raise PermissionDenied()
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(
            profile, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserPostsView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PostSerializer
    pagination_class = PostPagination

    def get_queryset(self):
        return Post.objects.filter(user__username=self.kwargs['username'])

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class UserSavedStarsView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = SavedStarSerializer

    def get_queryset(self):
        return SavedStar.objects.filter(user__username=self.kwargs['username'])


class SaveStarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, star_id):
        saved = SavedStar.objects.filter(user=request.user, star_catalog_id=star_id).exists()
        return Response({'saved': saved})

    def post(self, request, star_id):
        star_name = request.data.get('star_name', star_id)
        saved, created = SavedStar.objects.get_or_create(
            user=request.user,
            star_catalog_id=star_id,
            defaults={'star_name': star_name},
        )
        if not created:
            return Response({'message': 'Already saved', 'saved': True})
        return Response(SavedStarSerializer(saved).data, status=status.HTTP_201_CREATED)

    def delete(self, request, star_id):
        SavedStar.objects.filter(user=request.user, star_catalog_id=star_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StarPostsView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PostSerializer
    pagination_class = PostPagination

    def get_queryset(self):
        return Post.objects.filter(star_catalog_id=self.kwargs['star_id'])

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    pagination_class = PostPagination

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Post.objects.all()
        star_id = self.request.query_params.get('star_id')
        if star_id:
            qs = qs.filter(star_catalog_id=star_id)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PostDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Post.objects.all()

    def get_object(self):
        post = super().get_object()
        if post.user != self.request.user:
            raise PermissionDenied()
        return post


class LikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            post.like_count = max(0, post.like_count - 1)
            post.save(update_fields=['like_count'])
            return Response({'liked': False, 'like_count': post.like_count})
        post.like_count += 1
        post.save(update_fields=['like_count'])
        return Response({'liked': True, 'like_count': post.like_count})


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs['pk'])

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        try:
            post = Post.objects.get(pk=self.kwargs['pk'])
        except Post.DoesNotExist:
            raise PermissionDenied('Post not found')
        serializer.save(user=self.request.user, post=post)


class CommentDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Comment.objects.all()

    def get_object(self):
        comment = super().get_object()
        if comment.user != self.request.user:
            raise PermissionDenied()
        return comment


class TrendingStarsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        week_ago = timezone.now() - timedelta(days=7)
        post_counts = (
            Post.objects.filter(created_at__gte=week_ago, star_catalog_id__isnull=False)
            .exclude(star_catalog_id='')
            .values('star_catalog_id', 'star_name')
            .annotate(post_count=Count('id'))
        )
        save_counts = (
            SavedStar.objects.filter(saved_at__gte=week_ago)
            .values('star_catalog_id', 'star_name')
            .annotate(save_count=Count('id'))
        )

        activity = {}
        for p in post_counts:
            sid = p['star_catalog_id']
            activity[sid] = {
                'star_catalog_id': sid, 'star_name': p['star_name'] or sid,
                'post_count': p['post_count'], 'save_count': 0,
            }
        for s in save_counts:
            sid = s['star_catalog_id']
            if sid in activity:
                activity[sid]['save_count'] = s['save_count']
                if s['star_name']:
                    activity[sid]['star_name'] = s['star_name']
            else:
                activity[sid] = {
                    'star_catalog_id': sid, 'star_name': s['star_name'] or sid,
                    'post_count': 0, 'save_count': s['save_count'],
                }
        result = sorted(
            activity.values(),
            key=lambda x: x['post_count'] + x['save_count'],
            reverse=True,
        )[:10]
        return Response(result)


class FeedView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PostSerializer
    pagination_class = PostPagination

    def get_queryset(self):
        qs = Post.objects.all()
        star_id = self.request.query_params.get('star_id')
        if star_id:
            qs = qs.filter(star_catalog_id=star_id)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class StatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'total_users': User.objects.count(),
            'total_posts': Post.objects.count(),
            'total_saved_stars': SavedStar.objects.count(),
        })


class AstronomicalEventListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = AstronomicalEventSerializer

    def get_queryset(self):
        return AstronomicalEvent.objects.filter(is_active=True)


