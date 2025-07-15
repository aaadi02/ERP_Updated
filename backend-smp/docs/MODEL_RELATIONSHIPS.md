# Model Relationships and Population Guide

यह document सभी models के बीच relationships और उन्हें properly populate करने के तरीकों के बारे में है।

## Model Relationships Overview

### 1. Stream Model
```javascript
// Base model for academic streams
Stream {
  _id: ObjectId,
  name: String,
  description: String
}
```

### 2. AcademicDepartment Model
```javascript
AcademicDepartment {
  _id: ObjectId,
  name: String,
  stream: ObjectId (ref: "Stream")
}
```

### 3. Semester Model
```javascript
Semester {
  _id: ObjectId,
  number: Number,
  subjects: [ObjectId] (ref: "AdminSubject")
}
```

### 4. AdminSubject Model
```javascript
AdminSubject {
  _id: ObjectId,
  name: String,
  department: ObjectId (ref: "AcademicDepartment")
}
```

### 5. Faculty Model
```javascript
Faculty {
  _id: ObjectId,
  employeeId: String,
  firstName: String,
  lastName: String,
  department: ObjectId (ref: "AcademicDepartment"),
  subjectsTaught: [ObjectId] (ref: "AdminSubject"),
  ccAssignments: [{
    semester: ObjectId (ref: "Semester"),
    department: ObjectId (ref: "AcademicDepartment"),
    section: String,
    academicYear: String
  }]
}
```

### 6. Student Model
```javascript
Student {
  _id: ObjectId,
  enrollmentNumber: String,
  firstName: String,
  lastName: String,
  stream: ObjectId (ref: "Stream"),
  department: ObjectId (ref: "AcademicDepartment"),
  semester: ObjectId (ref: "Semester"),
  subjects: [ObjectId] (ref: "AdminSubject"),
  semesterRecords: [{
    semester: ObjectId (ref: "Semester"),
    subjects: [{
      subject: ObjectId (ref: "AdminSubject"),
      status: String,
      marks: Number
    }]
  }],
  backlogs: [ObjectId] (ref: "AdminSubject")
}
```

### 7. AccountStudent Model
```javascript
AccountStudent {
  _id: ObjectId,
  enrollmentNumber: String,
  firstName: String,
  lastName: String,
  stream: ObjectId (ref: "Stream"),
  department: ObjectId (ref: "AcademicDepartment"),
  currentSemester: ObjectId (ref: "Semester"),
  semesterEntries: [{
    semesterRecord: {
      semester: ObjectId (ref: "Semester"),
      subjects: [{
        subject: ObjectId (ref: "AdminSubject"),
        status: String,
        marks: Number
      }]
    }
  }]
}
```

### 8. Attendance Model
```javascript
Attendance {
  _id: ObjectId,
  student: ObjectId (ref: "student"),
  subject: ObjectId (ref: "AdminSubject"),
  faculty: ObjectId (ref: "Faculty"),
  semester: ObjectId (ref: "Semester"),
  department: ObjectId (ref: "AcademicDepartment"),
  date: Date,
  status: String
}
```

## Population Examples

### Basic Population
```javascript
// Get student with basic population
const student = await Student.findById(studentId)
  .populate('stream')
  .populate('department')
  .populate('semester');
```

### Deep Population
```javascript
// Get student with deep population
const student = await Student.findById(studentId)
  .populate({
    path: 'department',
    populate: {
      path: 'stream',
      select: 'name description'
    }
  })
  .populate({
    path: 'semester',
    populate: {
      path: 'subjects',
      select: 'name',
      populate: {
        path: 'department',
        select: 'name'
      }
    }
  });
```

### Multiple Level Population
```javascript
// Get attendance with all related data
const attendance = await Attendance.findById(attendanceId)
  .populate({
    path: 'student',
    select: 'firstName lastName enrollmentNumber',
    populate: {
      path: 'department',
      select: 'name'
    }
  })
  .populate({
    path: 'faculty',
    select: 'firstName lastName employeeId',
    populate: {
      path: 'department',
      select: 'name'
    }
  })
  .populate('subject', 'name')
  .populate('semester', 'number')
  .populate('department', 'name');
```

## Using the Populate Utility

### Import the utility
```javascript
import { populateQuery, getPopulateOptions } from '../utils/populateUtils.js';
```

### Use with different levels
```javascript
// Basic population
let query = Student.find();
query = populateQuery(query, 'student', 'basic');
const students = await query.exec();

// Detailed population
let detailedQuery = Faculty.find();
detailedQuery = populateQuery(detailedQuery, 'faculty', 'detailed');
const faculties = await detailedQuery.exec();
```

## API Endpoints for Populated Data

### Students
- `GET /api/populated/students` - Get all students with detailed population
- `GET /api/populated/students/:studentId` - Get specific student with full details

### Faculty
- `GET /api/populated/faculties` - Get all faculties with detailed population
- `GET /api/populated/faculties/:facultyId` - Get specific faculty with full details

### Attendance
- `GET /api/populated/attendance/:attendanceId` - Get specific attendance record
- `GET /api/populated/attendance-report` - Get attendance report with filters

### Account Students
- `GET /api/populated/account-students/:studentId` - Get account student with details

## Query Parameters for Reports

### Attendance Report
```
GET /api/populated/attendance-report?department=dept_id&semester=sem_id&startDate=2024-01-01&endDate=2024-12-31
```

Parameters:
- `department`: Department ObjectId
- `semester`: Semester ObjectId  
- `subject`: Subject ObjectId
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

## Response Format

All populated APIs return data in this format:
```javascript
{
  "success": true,
  "data": {
    // Populated model data
  },
  "count": 1 // For array responses
}
```

## Performance Considerations

1. **Select Only Required Fields**: Use `select` parameter to limit fields
2. **Limit Population Depth**: Don't populate unnecessary nested data
3. **Use Indexes**: Ensure proper indexes on reference fields
4. **Pagination**: Implement pagination for large datasets

## Error Handling

All controllers include comprehensive error handling:
- 404 for not found resources
- 500 for server errors
- Validation errors for invalid data

## Model Consistency

सभी models अब properly linked हैं:
- ✅ AcademicDepartment → Stream
- ✅ AdminSubject → AcademicDepartment  
- ✅ Semester → AdminSubject[]
- ✅ Faculty → AcademicDepartment, AdminSubject[]
- ✅ Student → Stream, AcademicDepartment, Semester, AdminSubject[]
- ✅ AccountStudent → Stream, AcademicDepartment, Semester
- ✅ Attendance → Student, Faculty, AdminSubject, Semester, AcademicDepartment

अब सभी models properly populate हो सकते हैं और complete data मिलेगा!
