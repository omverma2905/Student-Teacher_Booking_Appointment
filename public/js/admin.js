// scripts/admin.js
class Admin {
  async addTeacher(teacherDetails) {
    try {
      const teacherCredential = await authInstance.register(
        teacherDetails.email,
        teacherDetails.password,
        'teacher'
      );
      await db.collection('teachers').doc(teacherCredential.user.uid).set({
        name: teacherDetails.name,
        department: teacherDetails.department,
        subject: teacherDetails.subject,
      });
    } catch (error) {
      console.error('Error adding teacher:', error);
    }
  }

  async updateTeacher(teacherId, updatedDetails) {
    try {
      await db.collection('teachers').doc(teacherId).update(updatedDetails);
    } catch (error) {
      console.error('Error updating teacher:', error);
    }
  }

  async deleteTeacher(teacherId) {
    try {
      await db.collection('teachers').doc(teacherId).delete();
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  }

  async approveStudent(studentId) {
    try {
      await db.collection('students').doc(studentId).update({ status: 'approved' });
    } catch (error) {
      console.error('Error approving student:', error);
    }
  }
}

const adminInstance = new Admin();
