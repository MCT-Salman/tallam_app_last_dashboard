import axios from 'axios';

// Get list of all instructors
export const getInstructors = async () => {
    try {
        const response = await axios.get('/api/teachers');
        return response.data;
    } catch (error) {
        console.error('Error fetching instructors:', error);
        throw error;
    }
};

// Get teacher enrollments with filters
export const getTeacherEnrollments = async (params) => {
    try {
        const response = await axios.get('/api/teacher/enrollments', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching teacher enrollments:', error);
        throw error;
    }
};

// Export teacher enrollments to Excel
export const exportTeacherEnrollments = async (params) => {
    try {
        const response = await axios.get('/api/teacher/enrollments/export', {
            params,
            responseType: 'blob' // Important for file downloads
        });
        return response.data;
    } catch (error) {
        console.error('Error exporting teacher enrollments:', error);
        throw error;
    }
};
