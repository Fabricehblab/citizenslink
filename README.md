CitizenLink – Citizen Engagement System

**CitizenLink** is a digital platform designed to improve how citizens interact with their local governments. It enables citizens to easily submit complaints or feedback on public services, which are then categorized, routed, and tracked by local leaders at different levels of governance (Cell, Sector, District). The system promotes transparency, responsiveness, and accountability in government service delivery.


### For Citizens
- Submit complaints or feedback on public services via a web form
- Select the appropriate **governance level** (Cell, Sector)
- Receive responses and updates via **email**
- Track the **status** of their submissions (e.g., Pending, Solved)

 ### For Leaders (Cell/Sector/District)
- Login with credentials received via email
- View all submissions assigned to their level
- Mark cases as **solved** and respond with descriptions
- View individual case details

### For Super Admin
- Login with default credentials:
  - **Email**: `admin@gmail.com`
  - **Password**: `admin`
- Create and manage accounts for Cell, Sector, or other leaders
- Automatically send credentials to leaders via email

## Tech Stack


 Backend       => Node.js (Express.js)   
 Frontend      => EJS (Embedded JS Templating) 
 Database      => MySQL                  
 Auth          => JWT + Custom Middleware 
Email Service  => NodeMailer             
View Engine    => EJS                    



Core Functionalities

1. **Complaint Submission**
   - Citizens fill a form to submit complaints.
   - Includes complaint description, category, and target governance level.

2. **Routing & Categorization**
   - Submissions are routed based on citizen's selection (Cell or Sector).
   - Stored in MySQL with proper status tracking.

3. **Status Tracking**
   - Each complaint has a status: Pending, In Progress, Solved.
   - Citizens can view the status of their submission.

4. **Admin & Leader Interfaces**
   - Super Admin can manage system users and leaders.
   - Leaders receive email credentials and can manage assigned cases.

5. **Email Notifications**
   - Citizens receive feedback or status updates via email.


  ### 1. Clone the Repository
```bash
git clone https://github.com/MbarushimanaFabrice/_CitizensLink.git
cd citizenlink


npm install



Setup Environment Variables
.env

PORT=3002
 DB_HOST=bnoiotrxsvxfcd2wowmr-mysql.services.clever-cloud.com
 DB_USER=ulhjgbm3ad6coxet
 DB_PASS=ObW4YdJKBqPUjWT0IgR
 DB_NAME=bnoiotrxsvxfcd2wowmr


Run the App
bash
Copy
Edit
npm start