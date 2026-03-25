import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    email: {
      type: String,
      required: false,
      default: null
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['patient', 'doctor', 'hospital', 'medical_shop', 'admin'],
      required: true
    }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, createdAt: -1 });

// 🔐 Hash password with increased cost factor (12 rounds)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// 🔑 Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
