// scripts/student.js
class Student {
  constructor(user) {
    this.user = user;
  }

  async searchTeachers(department) {
    try {
      const snapshot = await db.collection('users')
        .where('role', '==', 'teacher')
        .where('department', '==', department)
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error searching teachers:', error);
    }
  }

  async bookAppointment(teacherId, appointmentDetails) {
    try {
      await db.collection('appointments').add({
        studentId: this.user.uid,
        teacherId: teacherId,
        appointmentDetails: appointmentDetails,
        status: 'pending',
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  }

  async sendMessage(teacherId, messageContent) {
    try {
      await db.collection('messages').add({
        studentId: this.user.uid,
        teacherId: teacherId,
        messageContent: messageContent,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}

let studentInstance = null;
