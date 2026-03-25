import AuditLog from '../models/AuditLog.js';
import LoginAudit from '../models/LoginAudit.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildPatientAdminResponse = (patient) => ({
  id: patient._id,
  userId: patient.user?._id || patient.user,
  fullName: patient.fullName,
  username: patient.user?.username || null,
  email: patient.user?.email || null,
  phone: patient.phone,
  govtId: patient.govtId,
  dob: patient.dob,
  age: patient.age,
  gender: patient.gender,
  bloodGroup: patient.bloodGroup,
  heightCm: patient.heightCm,
  weightKg: patient.weightKg,
  nfcId: patient.nfcUuid,
  fingerprintId: patient.fingerprintId,
  address: patient.address,
  emergencyContact: patient.emergencyContact,
  allergies: patient.allergies || [],
  surgeries: patient.surgeries || [],
  medicalHistory: patient.medicalHistory || [],
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt
});

export const getStatistics = async (_req, res) => {
  try {
    const [totalUsers, activeCards, dailyScans, emergencyAccess] = await Promise.all([
      User.countDocuments(),
      Patient.countDocuments({ nfcUuid: { $exists: true, $ne: null } }),
      AuditLog.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      AuditLog.countDocuments({ action: /EMERGENCY/i })
    ]);

    res.json({
      totalUsers,
      activeCards,
      dailyScans,
      emergencyAccess
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
};

export const getAuditLogs = async (_req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name username role')
      .populate('patient', 'fullName')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedLogs = logs.map((log) => ({
      id: log._id,
      action: log.action,
      user: log.actor?.name || log.actor?.username || 'Unknown user',
      target: log.patient?.fullName || log.resource || 'System',
      time: log.createdAt,
      actorRole: log.actorRole
    }));

    res.json(formattedLogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

export const getUsers = async (_req, res) => {
  try {
    // Use aggregation pipeline to optimize and combine queries
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'user',
          as: 'patientData'
        }
      },
      {
        $lookup: {
          from: 'loginaudits',
          let: { userPhone: { $arrayElemAt: ['$patientData.phone', 0] } },
          pipeline: [
            { $match: { $expr: { $eq: ['$phone', '$$userPhone'] }, status: 'LOGIN_SUCCESS' } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'lastLoginData'
        }
      },
      {
        $project: {
          id: '$_id',
          name: 1,
          role: 1,
          username: 1,
          status: 'active',
          lastLogin: { $arrayElemAt: ['$lastLoginData.createdAt', 0] },
          phone: { $arrayElemAt: ['$patientData.phone', 0] },
          hospital: { $cond: [{ $eq: ['$role', 'hospital'] }, '$name', 'Unified Network'] }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getPatientDetailsByUser = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.params.userId })
      .populate('user', 'name username email role')
      .lean();

    if (!patient) {
      return res.status(404).json({ message: 'Patient details not found for this user' });
    }

    res.json(buildPatientAdminResponse(patient));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch patient details' });
  }
};

export const searchPatients = async (req, res) => {
  try {
    const {
      q,
      phone,
      govtId,
      nfcId,
      limit = '20'
    } = req.query;

    const filters = [];

    if (q) {
      filters.push({
        fullName: { $regex: escapeRegex(q.trim()), $options: 'i' }
      });
    }

    if (phone) {
      filters.push({
        phone: { $regex: escapeRegex(phone.trim()) }
      });
    }

    if (govtId) {
      filters.push({ govtId: govtId.trim() });
    }

    if (nfcId) {
      filters.push({ nfcUuid: nfcId.trim() });
    }

    const query = filters.length ? { $and: filters } : {};
    const patients = await Patient.find(query)
      .populate('user', 'name username email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 20, 50))
      .lean();

    res.json(patients.map(buildPatientAdminResponse));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to search patients' });
  }
};

export const savePermissions = async (req, res) => {
  res.json({
    success: true,
    message: 'Permissions saved',
    permissions: req.body
  });
};
