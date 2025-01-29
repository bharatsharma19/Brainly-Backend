# Brainly-Backend
A simple Express.js backend for user authentication, content management, and sharing.

## Features
- User signup and authentication (JWT-based)
- Secure password hashing with bcrypt
- Content creation, retrieval, and deletion
- Shareable content links
- Middleware for authentication

## Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose ORM)
- JWT for authentication
- bcrypt for password hashing
- dotenv for environment variables
- CORS support

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/brainly-backend.git
   cd brainly-backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and add the required environment variables:
   ```env
   PORT=3000
   JWT_PASSWORD=your_secret_key
   MONGO_URI=your_mongodb_uri
   ```
4. Start the server:
   ```sh
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/v1/signup` - User registration
- `POST /api/v1/signin` - User login

### Content Management
- `POST /api/v1/content` - Add new content (Requires auth)
- `GET /api/v1/content` - Get user content (Requires auth)
- `DELETE /api/v1/content` - Delete content (Requires auth)

### Content Sharing
- `POST /api/v1/brain/share` - Generate share link (Requires auth)
- `GET /api/v1/brain/:shareLink` - View shared content

## License
This project is licensed under the MIT License.

## Contributing
Pull requests are welcome! For major changes, please open an issue first.

## Contact
For questions or support, reach out at bharat8717sharma@gmail.com.
