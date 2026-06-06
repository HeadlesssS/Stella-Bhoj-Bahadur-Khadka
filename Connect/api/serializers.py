from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile, SavedStar, Post, Like, Comment, AstronomicalEvent

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'created_at')
        read_only_fields = ('id', 'created_at')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


# ── Mini user info embedded in posts/comments ──────────────────────────────
class UserMiniSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'avatar_url')

    def get_avatar_url(self, obj):
        try:
            if obj.profile.avatar:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.profile.avatar.url)
                return obj.profile.avatar.url
        except Exception:
            pass
        return None


# ── UserProfile ────────────────────────────────────────────────────────────
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    joined = serializers.DateTimeField(source='user.created_at', read_only=True)
    posts_count = serializers.SerializerMethodField()
    saved_stars_count = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = (
            'username', 'email', 'bio', 'avatar', 'avatar_url',
            'posts_count', 'saved_stars_count', 'joined',
        )
        extra_kwargs = {'avatar': {'write_only': True, 'required': False}}

    def get_posts_count(self, obj):
        return obj.user.posts.count()

    def get_saved_stars_count(self, obj):
        return obj.user.saved_stars.count()

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


# ── SavedStar ──────────────────────────────────────────────────────────────
class SavedStarSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedStar
        fields = ('id', 'star_catalog_id', 'star_name', 'saved_at')
        read_only_fields = ('id', 'saved_at')


# ── Comment ────────────────────────────────────────────────────────────────
class CommentSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'user', 'content', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


# ── Post ───────────────────────────────────────────────────────────────────
class PostSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            'id', 'user', 'star_catalog_id', 'star_name', 'content',
            'image', 'image_url', 'created_at', 'like_count',
            'comments_count', 'is_liked',
        )
        extra_kwargs = {'image': {'write_only': True, 'required': False}}
        read_only_fields = ('id', 'user', 'created_at', 'like_count')

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


# ── AstronomicalEvent ──────────────────────────────────────────────────────
class AstronomicalEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AstronomicalEvent
        fields = ('id', 'name', 'description', 'event_date', 'target_star_catalog_id', 'is_active')
