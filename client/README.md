# NIET Student Dashboard

A student dashboard for NIET with features like announcements, timetable, students, and feedback.

## Features

- **Announcements**: View latest announcements from the institution
- **Timetable**: View class schedule based on department
- **students**: View student students information
- **Feedback**: Submit feedback when allowed by HOD

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd NIET-ERP/client
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure environment variables
- Create a `.env` file in the client directory (if not already present)
- Set the API URL to your MongoDB Atlas hosted backend:
```
REACT_APP_API_URL=https://your-backend-url.com
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

## Connecting to Backend

This dashboard is designed to connect to a MongoDB Atlas hosted backend. Make sure your backend provides the following API endpoints:

- `GET /announcements` - Fetch all announcements
- `GET /timetable/:department` - Fetch timetable for a specific department
- `GET /student/:studentId` - Fetch student students data
- `GET /feedback/permission/:studentId` - Check if feedback is allowed for a student
- `POST /feedback` - Submit feedback

## Authentication

The dashboard uses JWT authentication. When implementing the login functionality:

1. Store the JWT token in localStorage after successful login
2. The token will be included in API requests to authenticate the user
3. If the token expires or is invalid, the user will be redirected to the login page

## Customization

- Update the department and student information in the Dashboard component
- Modify the styling by editing the Tailwind CSS classes
- Add additional sections by creating new components and updating the Sidebar