import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  lastLoginAt: string | null;
  hasVrt: boolean;
  hasNec: boolean;
  hasNet: boolean;
}

export function ClinicianDashboard() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (query?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/patient', { params: { search: query } });
      setPatients(res.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients(search);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">{t('nav.patients')}</h1>
        <a
          href="/patients/new"
          className="rounded-lg bg-primary px-6 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover"
        >
          Add Patient
        </a>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mt-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="flex-1 rounded-lg border-2 border-border px-4 py-3 text-lg text-text placeholder:text-text-muted focus:border-primary focus-visible:outline-3 focus-visible:outline-focus"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover"
          >
            Search
          </button>
        </div>
      </form>

      {/* Patient list */}
      <div className="mt-6 overflow-hidden rounded-xl border-2 border-border">
        <table className="w-full">
          <thead className="bg-surface-secondary">
            <tr>
              <th className="px-6 py-4 text-left text-base font-semibold text-text">Name</th>
              <th className="px-6 py-4 text-left text-base font-semibold text-text">Email</th>
              <th className="px-6 py-4 text-left text-base font-semibold text-text">Therapies</th>
              <th className="px-6 py-4 text-left text-base font-semibold text-text">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-lg text-text-secondary">
                  Loading...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-lg text-text-secondary">
                  No patients found
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-t border-border hover:bg-surface-secondary cursor-pointer"
                  onClick={() => window.location.href = `/patients/${patient.id}`}
                >
                  <td className="px-6 py-4 text-lg font-medium text-text">
                    {patient.firstName} {patient.lastName}
                  </td>
                  <td className="px-6 py-4 text-base text-text-secondary">{patient.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {patient.hasVrt && (
                        <span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-text-on-primary">
                          VRT
                        </span>
                      )}
                      {patient.hasNec && (
                        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-white">
                          NEC
                        </span>
                      )}
                      {patient.hasNet && (
                        <span className="rounded-full bg-warning px-3 py-1 text-sm font-medium text-white">
                          NET
                        </span>
                      )}
                      {!patient.hasVrt && !patient.hasNec && !patient.hasNet && (
                        <span className="text-sm text-text-muted">None assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-base text-text-secondary">
                    {patient.lastLoginAt
                      ? new Date(patient.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
