// public/js/app.js
import { auth, db } from '../firebase/config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

// Rest of your App class code...

class App {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.initApp();
    }

    async initApp() {
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            if (user) {
                const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
                this.userRole = userDoc.docs[0].data().role;
            } else {
                this.userRole = null;
            }
            this.updateUI();
        });
    }

    updateUI() {
        const navMenu = document.getElementById('nav-menu');
        const appContent = document.getElementById('app-content');

        navMenu.innerHTML = '';
        appContent.innerHTML = '';

        if (this.currentUser) {
            const logoutButton = document.createElement('button');
            logoutButton.textContent = 'Logout';
            logoutButton.addEventListener('click', () => this.logout());
            navMenu.appendChild(logoutButton);

            switch (this.userRole) {
                case 'admin':
                    this.showAdminDashboard();
                    break;
                case 'teacher':
                    this.showTeacherDashboard();
                    break;
                case 'student':
                    this.showStudentDashboard();
                    break;
            }
        } else {
            const loginButton = document.createElement('button');
            loginButton.textContent = 'Login';
            loginButton.addEventListener('click', () => this.showLoginForm());
            navMenu.appendChild(loginButton);

            const registerButton = document.createElement('button');
            registerButton.textContent = 'Register';
            registerButton.addEventListener('click', () => this.showRegisterForm());
            navMenu.appendChild(registerButton);
        }
    }

    async logout() {
        try {
            await signOut(auth);
            this.currentUser = null;
            this.userRole = null;
            this.updateUI();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    showLoginForm() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <form id="login-form">
                <h2>Login</h2>
                <input type="email" id="login-email" placeholder="Email" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
        `;

        document.getElementById('login-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log('Logged in:', userCredential.user);
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please check your credentials and try again.');
            }
        });
    }

    showRegisterForm() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <form id="register-form">
                <h2>Register</h2>
                <input type="email" id="register-email" placeholder="Email" required>
                <input type="password" id="register-password" placeholder="Password" required>
                <select id="register-role">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                </select>
                <button type="submit">Register</button>
            </form>
        `;

        document.getElementById('register-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const role = document.getElementById('register-role').value;
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await addDoc(collection(db, 'users'), {
                    uid: userCredential.user.uid,
                    email: email,
                    role: role,
                    status: role === 'student' ? 'pending' : 'approved'
                });
                console.log('Registered:', userCredential.user);
                alert('Registration successful. Please log in.');
                this.showLoginForm();
            } catch (error) {
                console.error('Register error:', error);
                alert('Registration failed. Please try again.');
            }
        });
    }

    showAdminDashboard() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <h2>Admin Dashboard</h2>
            <div class="dashboard-buttons">
                <button id="add-teacher-btn">Add Teacher</button>
                <button id="approve-students-btn">Approve Students</button>
            </div>
        `;

        document.getElementById('add-teacher-btn').addEventListener('click', () => this.showAddTeacherForm());
        document.getElementById('approve-students-btn').addEventListener('click', () => this.showApproveStudentsForm());
    }

    showAddTeacherForm() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <form id="add-teacher-form">
                <h3>Add Teacher</h3>
                <input type="text" id="teacher-name" placeholder="Name" required>
                <input type="text" id="teacher-department" placeholder="Department" required>
                <input type="text" id="teacher-subject" placeholder="Subject" required>
                <input type="email" id="teacher-email" placeholder="Email" required>
                <input type="password" id="teacher-password" placeholder="Password" required>
                <button type="submit">Add Teacher</button>
            </form>
        `;

        document.getElementById('add-teacher-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('teacher-name').value;
            const department = document.getElementById('teacher-department').value;
            const subject = document.getElementById('teacher-subject').value;
            const email = document.getElementById('teacher-email').value;
            const password = document.getElementById('teacher-password').value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await addDoc(collection(db, 'users'), {
                    uid: userCredential.user.uid,
                    email: email,
                    role: 'teacher',
                    name: name,
                    department: department,
                    subject: subject,
                    status: 'approved'
                });
                console.log('Teacher added:', userCredential.user);
                alert('Teacher added successfully');
                this.showAdminDashboard();
            } catch (error) {
                console.error('Error adding teacher:', error);
                alert('Failed to add teacher. Please try again.');
            }
        });
    }

    async showApproveStudentsForm() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = '<h3>Approve Students</h3><div id="pending-students-list" class="list-container"></div>';

        const pendingStudentsList = document.getElementById('pending-students-list');
        const pendingStudentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('status', '==', 'pending'));
        const pendingStudentsSnapshot = await getDocs(pendingStudentsQuery);

        pendingStudentsSnapshot.forEach(doc => {
            const student = doc.data();
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.innerHTML = `
                ${student.email}
                <button class="approve-student-btn" data-student-id="${doc.id}">Approve</button>
            `;
            pendingStudentsList.appendChild(listItem);
        });

        pendingStudentsList.addEventListener('click', async (event) => {
            if (event.target.classList.contains('approve-student-btn')) {
                const studentId = event.target.getAttribute('data-student-id');
                await updateDoc(doc(db, 'users', studentId), { status: 'approved' });
                event.target.parentElement.remove();
                alert('Student approved successfully');
            }
        });
    }

    showTeacherDashboard() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <h2>Teacher Dashboard</h2>
            <div class="dashboard-buttons">
                <button id="schedule-appointment-btn">Schedule Appointment</button>
                <button id="view-appointments-btn">View Appointments</button>
                <button id="view-messages-btn">View Messages</button>
            </div>
        `;

        document.getElementById('schedule-appointment-btn').addEventListener('click', () => this.showScheduleAppointmentForm());
        document.getElementById('view-appointments-btn').addEventListener('click', () => this.showAppointments());
        document.getElementById('view-messages-btn').addEventListener('click',

 () => this.showMessages());
    }

    async showScheduleAppointmentForm() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <form id="schedule-appointment-form">
                <h3>Schedule Appointment</h3>
                <input type="date" id="appointment-date" required>
                <input type="time" id="appointment-time" required>
                <select id="student-select" required>
                    <option value="">Select a student</option>
                </select>
                <button type="submit">Schedule</button>
            </form>
        `;

        const studentSelect = document.getElementById('student-select');
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('status', '==', 'approved'));
        const studentsSnapshot = await getDocs(studentsQuery);

        studentsSnapshot.forEach(doc => {
            const student = doc.data();
            const option = document.createElement('option');
            option.value = student.uid;
            option.textContent = student.email;
            studentSelect.appendChild(option);
        });

        document.getElementById('schedule-appointment-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const date = document.getElementById('appointment-date').value;
            const time = document.getElementById('appointment-time').value;
            const studentId = document.getElementById('student-select').value;

            try {
                await addDoc(collection(db, 'appointments'), {
                    teacherId: this.currentUser.uid,
                    studentId: studentId,
                    date: date,
                    time: time,
                    status: 'scheduled'
                });
                console.log('Appointment scheduled');
                alert('Appointment scheduled successfully');
                this.showTeacherDashboard();
            } catch (error) {
                console.error('Error scheduling appointment:', error);
                alert('Failed to schedule appointment. Please try again.');
            }
        });
    }

    async showAppointments() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = '<h3>Appointments</h3><div id="appointments-list" class="list-container"></div>';

        const appointmentsList = document.getElementById('appointments-list');
        const appointmentsQuery = query(collection(db, 'appointments'), where('teacherId', '==', this.currentUser.uid));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);

        appointmentsSnapshot.forEach(doc => {
            const appointment = doc.data();
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.innerHTML = `
                Date: ${appointment.date}, Time: ${appointment.time}, Student ID: ${appointment.studentId}, Status: ${appointment.status}
                <button class="approve-appointment-btn" data-appointment-id="${doc.id}">Approve</button>
                <button class="cancel-appointment-btn" data-appointment-id="${doc.id}">Cancel</button>
            `;
            appointmentsList.appendChild(listItem);
        });

        appointmentsList.addEventListener('click', async (event) => {
            if (event.target.classList.contains('approve-appointment-btn')) {
                const appointmentId = event.target.getAttribute('data-appointment-id');
                await updateDoc(doc(db, 'appointments', appointmentId), { status: 'approved' });
                event.target.parentElement.remove();
                alert('Appointment approved');
            } else if (event.target.classList.contains('cancel-appointment-btn')) {
                const appointmentId = event.target.getAttribute('data-appointment-id');
                await deleteDoc(doc(db, 'appointments', appointmentId));
                event.target.parentElement.remove();
                alert('Appointment cancelled');
            }
        });
    }

    async showMessages() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = '<h3>Messages</h3><div id="messages-list" class="list-container"></div>';

        const messagesList = document.getElementById('messages-list');
        const messagesQuery = query(collection(db, 'messages'), where('teacherId', '==', this.currentUser.uid));
        const messagesSnapshot = await getDocs(messagesQuery);

        messagesSnapshot.forEach(doc => {
            const message = doc.data();
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.textContent = `From: ${message.studentId}, Message: ${message.content}`;
            messagesList.appendChild(listItem);
        });
    }

    showStudentDashboard() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <h2>Student Dashboard</h2>
            <div class="dashboard-buttons">
                <button id="search-teachers-btn">Search Teachers</button>
                <button id="book-appointment-btn">Book Appointment</button>
                <button id="send-message-btn">Send Message</button>
            </div>
        `;

        document.getElementById('search-teachers-btn').addEventListener('click', () => this.showSearchTeachersForm());
        document.getElementById('book-appointment-btn').addEventListener('click', () => this.showBookAppointmentForm());
        document.getElementById('send-message-btn').addEventListener('click', () => this.showSendMessageForm());
    }

    async showSearchTeachersForm() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <form id="search-teachers-form">
                <h3>Search Teachers</h3>
                <input type="text" id="department-search" placeholder="Department" required>
                <button type="submit">Search</button>
            </form>
            <div id="teachers-list" class="list-container"></div>
        `;

        document.getElementById('search-teachers-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const department = document.getElementById('department-search').value;
            const teachersList = document.getElementById('teachers-list');
            teachersList.innerHTML = '';

            const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'), where('department', '==', department));
            const teachersSnapshot = await getDocs(teachersQuery);

            teachersSnapshot.forEach(doc => {
                const teacher = doc.data();
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                listItem.textContent = `Name: ${teacher.name}, Subject: ${teacher.subject}`;
                teachersList.appendChild(listItem);
            });
        });
    }

    async showBookAppointmentForm() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <form id="book-appointment-form">
                <h3>Book Appointment</h3>
                <select id="teacher-select" required>
                    <option value="">Select a teacher</option>
                </select>
                <input type="date" id="appointment-date" required>
                <input type="time" id="appointment-time" required>
                <button type="submit">Book</button>
            </form>
        `;

        const teacherSelect = document.getElementById('teacher-select');
        const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const teachersSnapshot = await getDocs(teachersQuery);

        teachersSnapshot.forEach(doc => {
            const teacher = doc.data();
            const option = document.createElement('option');
            option.value = teacher.uid;
            option.textContent = `${teacher.name} - ${teacher.subject}`;
            teacherSelect.appendChild(option);
        });

        document.getElementById('book-appointment-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const teacherId = document.getElementById('teacher-select').value;
            const date = document.getElementById('appointment-date').value;
            const time = document.getElementById('appointment-time').value;

            try {
                await addDoc(collection(db, 'appointments'), {
                    teacherId: teacherId,
                    studentId: this.currentUser.uid,
                    date: date,
                    time: time,
                    status: 'pending'
                });
                console.log('Appointment booked');
                alert('Appointment booked successfully');
                this.showStudentDashboard();
            } catch (error) {
                console.error('Error booking appointment:', error);
                alert('Failed to book appointment. Please try again.');
            }
        });
    }

    async showSendMessageForm() {
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = `
            <form id="send-message-form">
                <h3>Send Message</h3>
                <select id="teacher-select" required>
                    <option value="">Select a teacher</option>
                </select>
                <textarea id="message-content" required></textarea>
                <button type="submit">Send</button>
            </form>
        `;

        const teacherSelect = document.getElementById('teacher-select');
        const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const teachersSnapshot = await getDocs(teachersQuery);

        teachersSnapshot.forEach(doc => {
            const teacher = doc.data();
            const option = document.createElement('option');
            option.value = teacher.uid;
            option.textContent = `${teacher.name} - ${teacher.subject}`;
            teacherSelect.appendChild(option);
        });

        document.getElementById('send-message-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const teacherId = document.getElementById('teacher-select').value;
            const content = document.getElementById('message-content').value;

            try {
                await addDoc(collection(db, 'messages'), {
                    teacherId: teacherId,
                    studentId: this.currentUser.uid,
                    content: content,
                    timestamp: new Date()
                });
                console.log('Message sent');
                alert('Message sent successfully');
                this.showStudentDashboard();
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Failed to send message. Please try again.');
            }
        });
    }
}

const appInstance = new App();