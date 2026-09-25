import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

export const CreateBoxPage: React.FC = () => {
  const navigate = useNavigate();
  const [parts, setParts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [selectedPartNumber, setSelectedPartNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [partsRes, custRes, boxRes] = await Promise.all([
        api.get('/parts/simple'),
        api.get('/customers'),
        api.get('/boxes', { params: { from_date: fromDate, to_date: toDate } }),
      ]);
      setParts(partsRes.data);
      if (partsRes.data.length > 0 && !selectedPartNumber) {
        setSelectedPartNumber(partsRes.data[0].part_number);
      }
      setCustomers(custRes.data);
      if (custRes.data.length > 0 && selectedCustomerId === '') {
        setSelectedCustomerId(custRes.data[0].id);
      }
      setBoxes(boxRes.data);
    } catch (err) {
      console.error('Error fetching data for create box', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    const partNum = selectedPartNumber;
    if (!partNum) {
      alert('Please select a Part');
      return;
    }
    try {
      const res = await api.post('/boxes', {
        box_name: partNum,
        customer_id: selectedCustomerId || undefined,
      });
      // Redirect to add packing to box matching legacy flow
      navigate(`/add_packing_to_box/${res.data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Unable to Add');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.get('/boxes', {
        params: { from_date: fromDate, to_date: toDate },
      });
      setBoxes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Content Header matching screenshot 09_create_box.png */}
      <div className="content-header">
        <h1>Create Box</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'block' }}>
            {/* Top Form matching screenshot 09_create_box.png */}
            <form onSubmit={handleCreateBox}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ width: '320px', zIndex: 10 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Part Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <Select
                    options={parts.map((p) => ({ value: p.part_number, label: `${p.part_number} / ${p.part_description}` }))}
                    value={parts.map((p) => ({ value: p.part_number, label: `${p.part_number} / ${p.part_description}` })).find(o => o.value === selectedPartNumber) || null}
                    onChange={(option) => setSelectedPartNumber(option ? option.value : '')}
                    placeholder="Search Part Number or Part Name..."
                    isClearable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                        fontSize: '14px',
                        borderColor: '#ced4da',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#80bdff'
                        }
                      })
                    }}
                  />
                </div>

                <div style={{ width: '220px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Customer Name
                  </label>
                  <select
                    className="form-control"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customer_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button type="submit" className="btn btn-danger" style={{ height: '38px' }}>
                    Submit
                  </button>
                </div>
              </div>
            </form>

            <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />

            {/* Date Filters matching screenshot 09_create_box.png */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ width: '180px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  From Date
                </label>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div style={{ width: '180px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  To Date
                </label>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-danger" style={{ height: '38px' }}>
                Search
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
