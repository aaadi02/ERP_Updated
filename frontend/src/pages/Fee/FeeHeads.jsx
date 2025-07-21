import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/fee-heads";
const STREAM_API = "http://localhost:5000/api/streams"; // assuming your stream list endpoint

export default function FeeHeads() {
  const [feeHeads, setFeeHeads] = useState([]);
  const [streams, setStreams] = useState([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    applyTo: "all",
    filters: {
      stream: "",
      casteCategory: "",
      semester: "",
    },
  });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const params = { search: searchTerm };
    axios.get(API, { params }).then((res) => {
      // Sort fee heads by title ascending (A-Z)
      const sorted = [...res.data].sort((a, b) => a.title.localeCompare(b.title));
      setFeeHeads(sorted);
    });
  }, [searchTerm]);

  useEffect(() => {
    axios.get(STREAM_API).then((res) => setStreams(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["stream", "casteCategory", "semester"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        filters: {
          ...prev.filters,
          [name]: value,
        },
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.amount) return;

    const payload = {
      title: form.title,
      amount: Number(form.amount),
      applyTo: form.applyTo,
    };

    if (form.applyTo === "filtered") {
      payload.filters = {
        stream: form.filters.stream || null,
        casteCategory: form.filters.casteCategory || null,
        semester: form.filters.semester || null,
      };
    }

    try {
      if (editId) {
        const res = await axios.put(`${API}/${editId}`, payload);
      setFeeHeads((prev) => {
        const updated = prev.map((f) => (f._id === editId ? res.data : f));
        // Resort after edit
        return [...updated].sort((a, b) => a.title.localeCompare(b.title));
      });
        setEditId(null);
      } else {
        const res = await axios.post(API, payload);
        const updated = [...feeHeads, res.data];
        // Resort after add
        setFeeHeads(updated.sort((a, b) => a.title.localeCompare(b.title)));
      }
      setForm({
        title: "",
        amount: "",
        applyTo: "all",
        filters: { stream: "", casteCategory: "", semester: "" },
      });
    } catch (err) {
      console.error("Error saving fee head:", err);
    }
  };

  const handleEdit = (head) => {
    setForm({
      title: head.title,
      amount: head.amount,
      applyTo: head.applyTo,
      filters: {
        stream: head.filters?.stream || "",
        casteCategory: head.filters?.casteCategory || "",
        semester: head.filters?.semester || "",
      },
    });
    setEditId(head._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/${id}`);
    setFeeHeads((prev) => {
      const filtered = prev.filter((f) => f._id !== id);
      // Resort after delete
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    });
  };

  const total = feeHeads.reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-white py-10 px-2 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-8 drop-shadow-lg tracking-tight flex items-center justify-center gap-2">
          <span role="img" aria-label="money">💰</span> Fee Heads
        </h1>

        {/* Assign Fee Head Form */}
        <div className="bg-white/90 rounded-3xl shadow-xl p-8 border border-blue-100 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2">
            {editId ? <span>✏️ Edit Fee Head</span> : <span>➕ Add New Fee Head</span>}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-2 text-blue-900">Fee Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-300 focus:outline-none text-lg transition"
                placeholder="e.g., Tuition Fee"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2 text-blue-900">Amount (₹)</label>
              <input
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                className="w-full border-2 border-green-200 rounded-xl p-3 focus:ring-2 focus:ring-green-300 focus:outline-none text-lg transition"
                placeholder="e.g., 5000"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-lg font-semibold mb-2 text-blue-900">Apply To</label>
            <select
              name="applyTo"
              value={form.applyTo}
              onChange={handleChange}
              className="w-full border-2 border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-300 focus:outline-none text-lg transition"
            >
              <option value="all">All Students</option>
              <option value="filtered">Filtered by Stream/Caste/Semester</option>
            </select>
          </div>
          {form.applyTo === "filtered" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <label className="block text-lg font-semibold mb-2 text-blue-900">Stream</label>
                <select
                  name="stream"
                  value={form.filters.stream}
                  onChange={handleChange}
                  className="w-full border-2 border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-300 focus:outline-none text-lg transition"
                >
                  <option value="">-- Select Stream --</option>
                  {streams.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2 text-blue-900">Caste Category</label>
                <select
                  name="casteCategory"
                  value={form.filters.casteCategory}
                  onChange={handleChange}
                  className="w-full border-2 border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-300 focus:outline-none text-lg transition"
                >
                  <option value="">-- Select Caste --</option>
                  <option value="open">Open</option>
                  <option value="obc">OBC</option>
                  <option value="sc">SC</option>
                  <option value="st">ST</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2 text-blue-900">Semester</label>
                <select
                  name="semester"
                  value={form.filters.semester}
                  onChange={handleChange}
                  className="w-full border-2 border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-300 focus:outline-none text-lg transition"
                >
                  <option value="">-- Select Semester --</option>
                  <option value="1">1st Semester</option>
                  <option value="2">2nd Semester</option>
                  <option value="3">3rd Semester</option>
                  <option value="4">4th Semester</option>
                  <option value="5">5th Semester</option>
                  <option value="6">6th Semester</option>
                  <option value="7">7th Semester</option>
                  <option value="8">8th Semester</option>
                </select>
              </div>
            </div>
          )}
          <button
            onClick={handleSubmit}
            className="mt-8 w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-lg transition disabled:opacity-60"
          >
            {editId ? "Update" : "Add"} Fee Head
          </button>
        </div>

        {/* Search and Summary */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white/90 rounded-2xl shadow p-6 border border-blue-100 mt-8 gap-4">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-300 focus:outline-none text-lg transition"
            />
          </div>
          <div className="text-right w-full md:w-auto">
            <p className="text-gray-600 text-lg">Total Fee Heads: <span className="font-bold text-blue-700">{feeHeads.length}</span></p>
            <p className="font-bold text-2xl text-green-700 mt-1">Total Amount: ₹{total.toLocaleString()}</p>
          </div>
        </div>

        {/* Fee Heads Table */}
        <div className="overflow-x-auto bg-white/90 rounded-2xl shadow-xl border border-blue-100 mt-8">
          <table className="min-w-full text-lg">
            <thead className="bg-gradient-to-r from-blue-100 to-green-100">
              <tr>
                <th className="p-4 text-left font-bold text-blue-900">Title</th>
                <th className="p-4 text-right font-bold text-blue-900">Amount (₹)</th>
                <th className="p-4 text-left font-bold text-blue-900">Applied To</th>
                <th className="p-4 text-center font-bold text-blue-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeHeads.map((f) => (
                <tr key={f._id} className="border-t hover:bg-blue-50 transition">
                  <td className="p-4 font-semibold text-blue-800">{f.title}</td>
                  <td className="p-4 text-right text-green-700 font-bold">₹{f.amount}</td>
                  <td className="p-4 text-left">
                    {f.applyTo === "all"
                      ? <span className="text-blue-600 font-semibold">All Students</span>
                      : <div className="flex flex-wrap gap-1">
                          {f.filters?.stream ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-sm">Stream: {streams.find(s => s._id === f.filters.stream)?.name || f.filters.stream}</span> : null}
                          {f.filters?.casteCategory ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-sm">Caste: {f.filters.casteCategory}</span> : null}
                          {f.filters?.semester ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-sm">Sem: {f.filters.semester}</span> : null}
                        </div>
                    }
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(f)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17v4h4l11-11a2.828 2.828 0 00-4-4L3 17z" /></svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(f._id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {feeHeads.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-400 text-xl">
                    No fee heads found.
                  </td>
                </tr>
              )}
            </tbody>
            {feeHeads.length > 0 && (
              <tfoot className="bg-gradient-to-r from-blue-50 to-green-50 font-semibold">
                <tr>
                  <td className="p-4 text-left">Total</td>
                  <td className="p-4 text-right text-green-700">₹{total}</td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
