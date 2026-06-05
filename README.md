# Stella - Interactive 3D Star Exploration & Social Platform
This project, Stella, is developed as a real-time, interactive 3D star exploration and social platform. The system enables users to navigate through a three-dimensional representation of the night sky using real astronomical data. Instead of relying on prerendered visuals, Stella dynamically renders stars based on their actual spatial positions derived from astronomical parameters such as Right Ascension, Declination, and distance. 
In addition to visualization, Stella integrates social networking features that allow users to interact with each other through posts, comments, likes, and saved stars. Each star acts as a central node where users can share observations, discussions, and astrophotography. Furthermore, an AI-powered assistant is embedded within the system to provide contextual explanations and answer user queries related to selected stars. 

# Screenshots
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/6fba9700-535b-4903-b3a4-02bc0ebf1f99" />
general view

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/360fde57-d85b-4762-9b2f-cce9ae0d50a3" />
wide view

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a97a89f3-e553-4745-aacb-1dc94069765a" />
Star Info

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c7e1e8de-2ddf-41b8-97b8-d32e7ac84a52" />
Post and comments

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/360f8a49-d69d-49f3-94fe-df64de8dbab7" />
AI chat feature

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/eb2b4bf4-bd3b-40a0-9ed4-b7d0135fb76f" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/fa68a054-e279-4371-adb5-43e33ebc5205" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7747b1d4-35d2-4b49-a145-5b24a9d80995" />
Mod feature

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/cebef192-2852-4a91-bfc9-75a77e0358eb" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c5e64206-4737-488f-9205-842a560800fe" />
Profile section

#  Installation and setup 
step 1: clone the project : git clone https://github.com/HeadlesssS/Stella-Bhoj-Bahadur-Khadka
step 2: go to Connect(Backend):  i) cd Connect ii) python manage.py install requirements.txt iii) python manage.py runserver
step 3: go to Stella(Frontend) : i) cd Stella ii) npm install iii) npm run dev
# Stella - Interactive 3D Star Exploration & Social Platform

**Stella** is a real-time, interactive 3D star exploration and social platform that brings astronomy to life through dynamic visualization and community engagement.

## Overview

This project, Stella, is developed as a real-time, interactive 3D star exploration and social platform. The system enables users to navigate through a three-dimensional representation of the night sky using real astronomical data. Instead of relying on prerendered visuals, Stella dynamically renders stars based on their actual spatial positions derived from astronomical parameters such as Right Ascension, Declination, and distance. 

In addition to visualization, Stella integrates social networking features that allow users to interact with each other through posts, comments, likes, and saved stars. Each star acts as a central node where users can share observations, discussions, and astrophotography. Furthermore, an AI-powered assistant is embedded within the system to provide contextual explanations and answer user queries related to selected stars. 

## Features

- **3D Star Visualization** — Dynamic rendering of stars based on real astronomical data (RA, Declination, distance)
- **Real Astronomical Data** — Powered by actual astronomical parameters for accurate celestial positioning
- **Social Networking** — Posts, comments, likes, and star-saving functionality for community engagement
- **AI-Powered Assistant** — Contextual explanations and answers for selected stars
- **User Profiles** — Personalized profiles with avatar and activity history
- **Star Collections** — Save and organize your favorite astronomical objects
- **Community Posts** — Share observations, astrophotography, and discussions tied to specific stars

## Tech Stack

**Backend:**
- Python 3
- Django & Django REST Framework
- SQLite (Development)

**Frontend:**
- React 18
- Vite (Build tool)
- JavaScript/JSX
- ESLint (Code quality)

## Project Structure

```
Stella/
├── Connect/                    # Django backend project
│   ├── api/                   # Main API app
│   │   ├── models.py         # Database models (User, Post, Comment, Star, etc.)
│   │   ├── serializers.py    # DRF serializers
│   │   ├── views.py          # API views
│   │   ├── urls.py           # API endpoints
│   │   └── migrations/       # Database migrations
│   ├── manage.py
│   ├── requirements.txt       # Python dependencies
│   ├── db.sqlite3            # SQLite database
│   └── media/                # User uploads (avatars, posts)
│
└── Stella/                    # React frontend
    ├── src/
    │   ├── components/       # React components
    │   ├── App.jsx
    │   ├── api.js           # API client
    │   └── main.jsx
    ├── public/              # Static assets
    ├── package.json         # Node dependencies
    ├── vite.config.js
    └── index.html
```

## Installation & Setup

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd Connect
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```
   The backend will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd Stella
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (or as shown in terminal)

## Getting Started

1. Start both backend and frontend servers (see Installation steps above)
2. Open your browser to the frontend URL
3. Register for an account or log in
4. Explore the 3D star visualization
5. Interact with the community through posts and comments
6. Use the AI assistant to learn more about selected stars

## API Endpoints

The backend provides RESTful API endpoints for:

- **Authentication** — User registration, login, logout
- **Users** — User profiles, avatars, activity
- **Stars** — Star data, astronomical information
- **Posts** — Create, read, update, delete posts tied to stars
- **Comments** — Discussion threads on posts
- **Likes** — Like/unlike posts and comments
- **Saved Stars** — Save and retrieve favorite stars

For detailed endpoint documentation, refer to [Connect/api/urls.py](Connect/api/urls.py)

## Screenshots

**General View**
![General view](https://github.com/user-attachments/assets/6fba9700-535b-4903-b3a4-02bc0ebf1f99)

**Wide View**
![Wide view](https://github.com/user-attachments/assets/360fde57-d85b-4762-9b2f-cce9ae0d50a3)

**Star Info Panel**
![Star Info](https://github.com/user-attachments/assets/a97a89f3-e553-4745-aacb-1dc94069765a)

**Posts & Comments**
![Post and comments](https://github.com/user-attachments/assets/c7e1e8de-2ddf-41b8-97b8-d32e7ac84a52)

**AI Chat Feature**
![AI chat feature](https://github.com/user-attachments/assets/360f8a49-d69d-49f3-94fe-df64de8dbab7)

**Mod Features**
![Mod feature 1](https://github.com/user-attachments/assets/eb2b4bf4-bd3b-40a0-9ed4-b7d0135fb76f)
![Mod feature 2](https://github.com/user-attachments/assets/fa68a054-e279-4371-adb5-43e33ebc5205)
![Mod feature 3](https://github.com/user-attachments/assets/7747b1d4-35d2-4b49-a145-5b24a9d80995)

**Profile Section**
![Profile 1](https://github.com/user-attachments/assets/cebef192-2852-4a91-bfc9-75a77e0358eb)
![Profile 2](https://github.com/user-attachments/assets/c5e64206-4737-488f-9205-842a560800fe)

## Development Notes

- Astronomical data is sourced from real astronomical catalogs
- The 3D rendering uses dynamic calculations based on star coordinates
- The system supports real-time social interactions and AI-powered insights

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

[Add your license here]

---

Built with ❤️ for astronomy enthusiasts and stargazers everywhere.
