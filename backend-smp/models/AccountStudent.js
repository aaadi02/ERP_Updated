import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const accountStudentSchema = new Schema({
  enrollmentNumber: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  mobileNumber: { type: String },
  email: { type: String },
  stream: { type: String, required: true },
  semesterEntries: [
    {
      semesterRecord: {
        semester: {
          _id: { type: String },
          number: { type: Number },
        },
        subjects: [
          {
            subject: {
              _id: { type: String },
              name: { type: String },
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
});

const AccountStudent = model('AccountStudent', accountStudentSchema);

export default AccountStudent;
