import SalaryRecord from "../models/SalaryRecord.js";

const addSalaryRecord = async (req, res) => {
  try {
    const { employeeId, name, department, designation, type } = req.body;

    if (!employeeId || !name || !department || !designation || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const salaryRecord = new SalaryRecord({
      employeeId,
      name,
      department,
      designation,
      type,
    });

    await salaryRecord.save();
    res.status(201).json({ message: "Salary record created successfully" });
  } catch (error) {
    console.error("Error creating salary record:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to create salary record" });
  }
};

// Fetch all salary records
const getAllSalaryRecords = async (req, res) => {
  try {
    const records = await SalaryRecord.find();
    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching salary records:", error);
    res.status(500).json({ message: "Failed to fetch salary records" });
  }
};

// Fetch salary record by employeeId
const getSalaryRecordById = async (req, res) => {
  try {
    const record = await SalaryRecord.findOne({ employeeId: req.params.id });
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.status(200).json(record);
  } catch (error) {
    console.error("Error fetching salary record:", error);
    res.status(500).json({ message: "Failed to fetch salary record" });
  }
};

// Update salary record by employeeId
const updateSalaryRecord = async (req, res) => {
  try {
    const {
      name,
      department,
      designation,
      type,
      basicSalary,
      hra,
      da,
      bonus,
      overtimePay,
      taxDeduction,
      pfDeduction,
      otherDeductions,
      workingHours,
      leaveDeduction,
      paymentMethod,
      bankAccount,
      status,
    } = req.body;

    // Find the record by employeeId
    const record = await SalaryRecord.findOne({ employeeId: req.params.id });

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Update fields
    if (name) record.name = name;
    if (department) record.department = department;
    if (designation) record.designation = designation;
    if (type) record.type = type;
    if (basicSalary !== undefined) record.basicSalary = basicSalary;
    if (hra !== undefined) record.hra = hra;
    if (da !== undefined) record.da = da;
    if (bonus !== undefined) record.bonus = bonus;
    if (overtimePay !== undefined) record.overtimePay = overtimePay;
    if (taxDeduction !== undefined) record.taxDeduction = taxDeduction;
    if (pfDeduction !== undefined) record.pfDeduction = pfDeduction;
    if (otherDeductions !== undefined) record.otherDeductions = otherDeductions;
    if (workingHours !== undefined) record.workingHours = workingHours;
    if (leaveDeduction !== undefined) record.leaveDeduction = leaveDeduction;
    if (paymentMethod) record.paymentMethod = paymentMethod;
    if (bankAccount) record.bankAccount = bankAccount;
    if (status) record.status = status;

    // Recalculate gross salary and net salary
    record.grossSalary =
      (record.basicSalary || 0) +
      (record.hra || 0) +
      (record.da || 0) +
      (record.bonus || 0) +
      (record.overtimePay || 0);

    record.netSalary =
      record.grossSalary -
      (record.taxDeduction || 0) -
      (record.pfDeduction || 0) -
      (record.otherDeductions || 0) -
      (record.leaveDeduction || 0);

    // Save updated record
    await record.save();

    res.status(200).json({
      message: "Salary record updated successfully",
      record,
    });
  } catch (error) {
    console.error("Error updating salary record:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to update salary record" });
  }
};

export {
  addSalaryRecord,
  getAllSalaryRecords,
  getSalaryRecordById,
  updateSalaryRecord,
};
