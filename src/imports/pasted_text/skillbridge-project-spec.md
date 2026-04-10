**PROJECT OVERVIEW:**

# **SkillBridge — A Peer‑to‑Peer Skill Exchange Platform**

SkillBridge is a **full‑stack web platform that connects individuals who want to exchange skills and knowledge without monetary transactions.**

Users list **skills they can teach** and **skills they want to learn**, and the platform **intelligently matches them with other users** who complement their learning goals.

The system enables **skill discovery, request exchange, communication, and session scheduling**.

---

# **1️⃣ Landing Page**

The landing page introduces the project and encourages users to join the platform.

### **Purpose**

- Explain the platform
- Show benefits
- Build trust
- Encourage sign‑up

### **Sections**

### **Hero Section**

First screen users see.

Content:

- Project name: **SkillBridge**
- Tagline
    
    *"Learn Skills. Share Knowledge. Grow Together."*
    

Buttons:

- **Get Started**
- **Login**

Visuals:

- Illustration of people exchanging skills
- Example skills (Python, Guitar, Design, Marketing)

---

### **How It Works Section**

Simple 3‑step explanation.

1️⃣ Create your skill profile

2️⃣ Find people with matching skills

3️⃣ Exchange knowledge through sessions

---

### **Platform Features**

Display main features:

- Smart Skill Matching
- Skill Exchange Requests
- Secure Messaging
- Session Scheduling
- Skill Portfolio
- Community Learning

---

### **Example Skill Exchanges**

Examples:

```
Python ↔ Photoshop
Public Speaking ↔ UI Design
Guitar ↔ Video Editing
```

This helps users quickly understand the concept.

---

### **Benefits Section**

Benefits of using the platform:

- Learn skills for free
- Teach what you already know
- Build a strong network
- Improve practical experience
- Discover hidden talent in your community

---

### **Call to Action**

Buttons:

- **Create Account**
- **Start Skill Exchange**

---

### **Footer**

Contains:

- About
- Contact
- Help
- Privacy Policy
- GitHub / Project Info
- Credits

---

# **2️⃣ Login / Signup Page**

Simple and minimal authentication system.

### **Signup Fields**

Only essential fields:

Name

Email

Password

Confirm Password

Optional:

College / Organization

Buttons:

- **Sign Up**
- **Already have an account? Login**

---

### **Login Fields**

Email

Password

Buttons:

- Login
- Forgot Password (optional)

---

### **Backend Implementation**

Authentication handled using:

- **JWT tokens**
- password hashing using **bcrypt**

---

# **3️⃣ Skill Profile Setup Page (First Time Users)**

After signup, users must create their **Skill Profile**.

This step helps the system understand the user.

---

### **User Information**

Fields:

Full Name

Short Bio

Location (optional)

Profile Image

---

### **Skills You Can Teach**

User enters:

Examples:

Python

Guitar

Graphic Design

Excel

Public Speaking

Allow multiple entries.

---

### **Skills You Want to Learn**

Examples:

React

Video Editing

Photography

UI Design

---

### **Skill Level (Optional)**

Beginner

Intermediate

Advanced

---

### **Learning Objective**

Ask user:

"What are you looking for?"

Options:

- Learn a new skill
- Improve existing skills
- Teach others
- Collaborate on projects

---

### **Save Profile**

User profile is stored in the database.

After completion:

User proceeds to **matching option page**.

---

# **4️⃣ Smart Matching Option Page**

User is given two choices.

### **Option 1**

**Start Smart Matching**

### **Option 2**

**Skip for Now**

---

# **5️⃣ Smart Matching System**

If user chooses **Start Smart Matching**, the system runs a matching algorithm.

---

## **Matching Animation**

UI shows:

Searching for skill matches…

Progress animation / loading effect.

This improves UX.

---

## **Matching Algorithm**

Simple but effective logic.

```
User A teaches Python
User B wants Python

AND

User B teaches Photoshop
User A wants Photoshop

→ Perfect match
```

Basic implementation:

```
if userA.teachSkill == userB.learnSkill
suggest match
```

Multiple matches may appear.

---

## **Match Recommendation Page**

Display matched users as **cards**.

Each card shows:

Profile image

Name

Skills they teach

Skills they want to learn

Compatibility score (optional)

Buttons:

View Profile

Send Skill Swap Request

---

# **6️⃣ Skill Swap Request System**

Users can send a skill exchange proposal.

Example:

```
A → B

"I can teach Python if you teach Photoshop"
```

Request contains:

Sender

Receiver

Skill Offered

Skill Requested

Optional message

---

## **Request Status**

Each request has a status.

Pending

Accepted

Rejected

Users can view requests in their dashboard.

---

# **7️⃣ Basic Chat System**

If request is **accepted**, users can communicate.

Implementation:

Simplest approach:

- REST API messaging
- Messages stored in database

No real‑time required for MVP.

---

### **Chat Features**

Send message

View conversation history

Time stamps

Basic message notifications

---

# **8️⃣ Session Scheduling**

Users can schedule a learning session.

Fields:

Date

Time

Duration

Meeting Link (Zoom / Google Meet)

Example:

```
Python lesson
Date: Saturday
Time: 5 PM
Duration: 1 hour
```

Both users must confirm.

---

### **Session Status**

Scheduled

Completed

Cancelled

---

# **9️⃣ Dashboard**

If user skips smart matching or finishes profile setup, they land on the **Dashboard**.

This is the main user workspace.

---

### **Dashboard Sections**

---

### **Profile**

View and edit:

Skills

Bio

Projects

Profile picture

---

### **My Skills**

Shows:

Skills you teach

Skills you want to learn

---

### **Matches**

Shows recommended skill matches.

---

### **Requests**

Shows:

Incoming requests

Sent requests

Request status

---

### **Chats**

List of active conversations.

---

### **Sessions**

Shows:

Upcoming sessions

Past sessions

---

### **Portfolio Section**

Users can optionally add:

Projects

Certifications

GitHub link

LinkedIn

---

### **Settings**

Change password

Edit profile

Delete account

---

### **Help**

FAQs

Contact support

Platform guide

---

# **🔟 Additional Features (Optional but Impressive)**

These features improve project quality.

---

### **Skill Categories**

Group skills into categories:

Technology

Creative

Business

Languages

Music

---

### **Skill Ratings**

After sessions users can rate each other.

Example:

⭐ ⭐ ⭐ ⭐ ⭐

---

### **Search System**

Users can manually search skills.

Example:

Search: "Python"

Shows people teaching Python.

---

### **Notifications**

Users get notified when:

- New request arrives
- Request accepted
- Session scheduled
- Message received

---

# **Database Overview**

Main collections:

Users

Requests

Messages

Sessions

---

# **System Architecture**

```
User Browser
     │
React + Tailwind (Frontend)
     │
Node.js + Express API
     │
MongoDB Atlas Database
     │
Cloudinary Image Storage
```

---

# **Why This Project Is Strong**

This system demonstrates:

Full stack development

Authentication system

Matching algorithm

Messaging system

Scheduling system

Database design

Real world problem solving

---

# **Realistic Scope (Very Important)**

For your **college project**, focus on MVP:

Must Build:

Landing page

Login/signup

Skill profile

Matching system

Requests

Basic chat

Dashboard

Optional:

Scheduling

Ratings

Search

**STRUCTURE:**

# **1️⃣ Landing Page**

### **Purpose**

Introduce the platform and convince users to sign up.

### **Sections**

**Navbar**

- Logo (SkillBridge)
- Home
- How it Works
- Features
- Login
- Sign Up

---

**Hero Section**

Title

**SkillBridge – Learn Skills, Share Knowledge**

Subtitle

Connect with people who can teach what you want to learn.

Buttons

- Get Started
- Login

---

**How It Works**

3 step explanation:

1️⃣ Create your skill profile

2️⃣ Discover skill matches

3️⃣ Exchange knowledge

---

**Platform Features**

Cards showing:

- Smart Skill Matching
- Skill Exchange Requests
- Messaging System
- Session Scheduling
- Skill Portfolio

---

**Example Skill Swaps**

Example cards:

Python ↔ Photoshop

Guitar ↔ Video Editing

Public Speaking ↔ UI Design

---

**Call to Action**

Button:

Create Your Skill Profile

---

**Footer**

Links:

About

Help

Contact

Project Info

GitHub

---

# **2️⃣ Signup Page**

### **Purpose**

Register new users.

### **Fields**

Name

Email

Password

Confirm Password

Optional

College / Organization

Buttons

Sign Up

Login Instead

---

# **3️⃣ Login Page**

### **Fields**

Email

Password

Buttons

Login

Create Account

---

# **4️⃣ First‑Time Skill Profile Setup**

This appears **after signup**.

### **Section 1 — Basic Info**

Full Name

Short Bio

Profile Picture

Optional:

Location

---

### **Section 2 — Skills You Can Teach**

Input field with add button.

Example:

```
Python
Guitar
Photoshop
Public Speaking
```

---

### **Section 3 — Skills You Want to Learn**

Example:

```
React
Video Editing
Photography
UI Design
```

---

### **Section 4 — Learning Objective**

Ask the user:

What are you looking for?

Options:

Learn new skills

Teach others

Collaborate on projects

Improve existing skills

---

### **Button**

Save Profile

---

# **5️⃣ Smart Matching Option Page**

After completing profile.

### **Page Content**

Title

**Find Your Skill Matches**

Message:

We can automatically find people who match your learning goals.

---

### **Two Options**

**Start Smart Matching**

or

**Skip for Now**

---

# **6️⃣ Smart Matching Page**

If user chooses smart matching.

### **Animation Section**

Loading animation:

```
Finding skill matches...
```

Simulate algorithm running.

---

### **Backend Matching Logic**

Example:

```
User A teaches Python
User B wants Python

User B teaches Photoshop
User A wants Photoshop
```

Match found.

---

### **Match Results**

Display cards:

Profile picture

Name

Skills they teach

Skills they want to learn

Buttons:

View Profile

Send Request

---

# **7️⃣ Match Profile Page**

Shows detailed info about the matched user.

### **Profile Info**

Name

Bio

Skills they teach

Skills they want to learn

Skill level

---

### **Portfolio Section**

Optional:

Projects

GitHub

LinkedIn

---

### **Request Section**

Button

Send Skill Swap Request

---

# **8️⃣ Skill Swap Request Page**

Users create a skill exchange proposal.

### **Form**

Skill you offer

Example:

Python

Skill you want

Example:

Photoshop

Message

Example:

"I can teach Python if you teach Photoshop."

---

### **Request Status System**

States:

Pending

Accepted

Rejected

---

# **9️⃣ Chat Page**

Unlocked after request is **accepted**.

### **Chat Layout**

Left Sidebar

List of conversations.

Right Section

Chat window.

---

### **Chat Features**

Send message

View message history

Timestamp

Example

```
A: Hi! When can we start the session?

B: Tomorrow evening works.
```

---

# **🔟 Session Scheduling Page**

Users schedule a learning session.

### **Form**

Session Topic

Example

Python Basics

Date

Time

Duration

Meeting Link

Example

Google Meet / Zoom

---

### **Confirmation**

Both users must confirm.

---

# **1️⃣1️⃣ Dashboard**

Main workspace of the user.

Accessible anytime.

---

### **Sidebar Menu**

Dashboard

Profile

Skills

Matches

Requests

Chats

Sessions

Settings

Help

---

### **Dashboard Overview**

Displays:

Upcoming sessions

New requests

Recent matches

Active chats

---

# **1️⃣2️⃣ Profile Page**

User can edit their profile.

Fields:

Bio

Skills

Projects

Portfolio links

---

# **1️⃣3️⃣ Requests Page**

Shows all requests.

Tabs:

Incoming Requests

Sent Requests

Each request shows:

Skill offer

Skill request

Status

---

# **1️⃣4️⃣ Sessions Page**

Shows all sessions.

Upcoming

Completed

Cancelled

---

# **1️⃣5️⃣ Settings Page**

Options:

Change password

Edit profile

Delete account

---

# **Database Collections**

You will need **4 main collections**.

---

### **Users**

```
name
email
password
bio
teachSkills[]
learnSkills[]
profileImage
```

---

### **Requests**

```
senderId
receiverId
skillOffered
skillWanted
status
```

---

### **Messages**

```
senderId
receiverId
message
timestamp
```

---

### **Sessions**

```
user1
user2
topic
date
time
meetingLink
status
```

---

# **Final System Architecture**

```
User Browser
      │
React + Tailwind Frontend
      │
Node.js + Express Backend
      │
MongoDB Atlas Database
      │
Cloudinary Image Storage
```

**DESIGN SYSTEM:**
# **Design Philosophy**

SkillBridge is a **collaborative learning platform**, so the design should communicate:

- trust
- knowledge sharing
- simplicity
- productivity
- community

The UI should feel similar to platforms like **Notion / Linear / Slack / modern SaaS dashboards**.

Design principles:

- clean layouts
- minimal distractions
- readable typography
- soft friendly colors
- accessible contrast

---

# **1. Color Palette**

The palette is designed to feel **educational, modern, and collaborative**.

## **Primary Color**

Primary represents **learning, connection, and growth**.

**Primary Blue**

```
#4F46E5
```

Usage:

- primary buttons
- active navigation
- links
- highlights
- progress elements

---

## **Secondary Color**

Secondary adds **freshness and collaboration energy**.

**Emerald Green**

```
#10B981
```

Usage:

- confirmations
- skill tags
- accepted requests
- session confirmations

---

## **Accent Color**

Accent adds **visual interest and call‑to‑action emphasis**.

**Vibrant Purple**

```
#8B5CF6
```

Usage:

- hover states
- feature highlights
- special badges
- recommended matches

---

## **Background Colors**

### **Light Mode**

Main background

```
#F9FAFB
```

Card background

```
#FFFFFF
```

Section background

```
#F3F4F6
```

---

### **Dark Mode (Optional)**

Main background

```
#0F172A
```

Card background

```
#1E293B
```

Section background

```
#111827
```

---

## **Text Colors**

Primary text

```
#111827
```

Secondary text

```
#6B7280
```

Disabled text

```
#9CA3AF
```

Inverse text (for dark backgrounds)

```
#FFFFFF
```

---

## **Status Colors**

Success

```
#22C55E
```

Used for:

- accepted requests
- session scheduled
- profile saved

---

Error

```
#EF4444
```

Used for:

- login errors
- failed requests
- form validation errors

---

Warning

```
#F59E0B
```

Used for:

- pending requests
- incomplete profile
- session reminders

---

Info

```
#3B82F6
```

Used for:

- notifications
- tips
- helpful messages

---

# **2. Typography**

Typography should prioritize **readability and modern aesthetics**.

## **Font Families**

### **Headings**

```
Inter
```

Reason:

- modern
- highly readable
- widely used in SaaS apps

---

### **Body Text**

```
Inter
```

Keeps design consistent and simple.

---

### **Monospace (Optional)**

Used for:

- code examples
- developer profiles

```
JetBrains Mono
```

---

## **Font Sizes**

Use a **scalable typography system**.

| **Element** | **Size** |
| --- | --- |
| h1 | 36px |
| h2 | 30px |
| h3 | 24px |
| h4 | 20px |
| body | 16px |
| small | 14px |
| caption | 12px |

---

## **Font Weights**

Regular

```
400
```

Used for:

body text

---

Medium

```
500
```

Used for:

labels

navigation

---

Semi Bold

```
600
```

Used for:

section headings

---

Bold

```
700
```

Used for:

major titles

---

## **Line Heights**

| **Element** | **Line Height** |
| --- | --- |
| headings | 1.25 |
| body text | 1.6 |
| small text | 1.4 |

Example:

```
font-size: 16px
line-height: 1.6
```

---

# **3. Spacing System**

Use a **4px base spacing scale**.

This ensures consistent layouts.

| **Token** | **Value** |
| --- | --- |
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 40px |
| 3xl | 48px |
| 4xl | 64px |

---

Example usage:

```
Card padding → 24px
Section padding → 48px
Button padding → 8px 16px
```

---

# **4. Layout Grid System**

Use a **12‑column responsive grid**.

Container width:

```
1200px max
```

Breakpoints:

| **Screen** | **Width** |
| --- | --- |
| mobile | <640px |
| tablet | 768px |
| laptop | 1024px |
| desktop | 1280px |

---

# **5. Component Design Rules**

## **Buttons**

Primary Button

Background

```
#4F46E5
```

Text

```
#FFFFFF
```

Hover

```
#4338CA
```

Padding

```
10px 20px
```

Border radius

```
8px
```

---

Secondary Button

Background

```
transparent
```

Border

```
1px solid #E5E7EB
```

Hover

```
#F3F4F6
```

---

# **6. Card Design**

Cards will be used for:

- skill matches
- profiles
- requests
- dashboard widgets

Card style:

```
background: #FFFFFF
border: 1px solid #E5E7EB
border-radius: 12px
padding: 24px
box-shadow: 0px 4px 12px rgba(0,0,0,0.05)
```

---

# **7. Input Fields**

Used in:

- signup
- login
- skill profile

Style

```
border: 1px solid #D1D5DB
border-radius: 8px
padding: 10px
font-size: 16px
```

Focus state

```
border-color: #4F46E5
outline: none
```

---

# **8. Skill Tags**

Used for displaying user skills.

Example:

```
Python
Photoshop
React
```

Style

Background

```
#EEF2FF
```

Text

```
#4F46E5
```

Padding

```
4px 10px
```

Border radius

```
999px
```

---

# **9. Animations**

Animations should be **minimal and smooth**.

Duration

```
200ms – 300ms
```

Use for:

- hover effects
- button interactions
- smart matching loading animation
- chat message appearance

---

# **10. Icons**

Use:

```
Lucide Icons
```

or

```
Heroicons
```

Common icons needed:

- search
- user
- chat
- calendar
- settings
- notification
- skills

---

# **11. Border Radius System**

| **Element** | **Radius** |
| --- | --- |
| inputs | 8px |
| buttons | 8px |
| cards | 12px |
| modals | 16px |

---

# **12. Shadows**

Use soft shadows for depth.

Card shadow

```
0 4px 12px rgba(0,0,0,0.05)
```

Dropdown shadow

```
0 8px 24px rgba(0,0,0,0.08)
```

---

# **13. UI Component List (Important)**

Your project will require these reusable components:

Navbar

Button

Input field

Skill tag

Card

User profile card

Match card

Chat bubble

Sidebar

Modal

Notification toast

Session card

---

# **14. Accessibility Rules**

Ensure:

- color contrast ratio > 4.5
- clickable elements ≥ 44px
- form labels present
- keyboard navigation works

---

# **15. Tailwind Token Mapping (Optional)**

This design system maps easily to Tailwind.

Example:

Primary color

```
primary: #4F46E5
```

Spacing

```
p-4 = 16px
p-6 = 24px
p-8 = 32px
```

Border radius

```
rounded-lg = 12px
```

---

# **Final Result**

Following this guide will produce a UI that is:

- **modern**
- **clean**
- **consistent**
- **easy to build**
- **professional enough for a real startup**

Build out all pages as separate page components with full functionality, content, and styling according to the design system. Make this a complete, working prototype.