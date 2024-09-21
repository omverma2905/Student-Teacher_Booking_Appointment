// scripts/teacher.js
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

class Teacher {
  constructor(user) {
    this.user = user;
  }

  async scheduleAppointment(studentId, appointmentDetails) {
    try {
      await addDoc(collection(db, 'appointments'), {
        teacherId: this.user.uid,
        studentId: studentId,
        appointmentDetails: appointmentDetails,
        status: 'pending',
      });
    } catch (error) {
      console.error('Error scheduling appointment:', error);
    }
  }

  async viewAppointments() {
    try {
      const q = query(collection(db, 'appointments'), where('teacherId', '==', this.user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }
}

export default Teacher;
