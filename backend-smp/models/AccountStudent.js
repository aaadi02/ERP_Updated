import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const accountStudentSchema = new Schema({
  enrollmentNumber: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  mobileNumber: { type: String },
  email: { type: String },
  stream: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Stream", 
    required: true 
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicDepartment",
    required: true
  },
  currentSemester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester"
  },
  semesterEntries: [
    {
      semesterRecord: {
        semester: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Semester"
        },
        subjects: [
          {
            subject: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "AdminSubject"
            },
            status: { type: String },
            marks: { type: Number, default: null },
          },
        ],
        isBacklog: { type: Boolean, default: false },
      },
      message: { type: String, required: true },
      addedAt: { type: Date, default: Date.now },
    },
  ],
}, {
  timestamps: true
});

const AccountStudent = model('AccountStudent', accountStudentSchema);

export default AccountStudent;
