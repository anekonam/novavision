import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEnabled: boolean;
  lastLoginAt: string | null;
}

interface LicenceSummary {
  licenceId: number;
  licenceKey: string;
  type: string;
  status: string;
  includesVrt: boolean;
  includesNec: boolean;
  includesNet: boolean;
  expiryDate: string;
}

export function AdminDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'users' | 'licences'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [licences, setLicences] = useState<LicenceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else loadLicences();
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const loadLicences = async () => {
    setLoading(true);
    try {
      const res = await api.get('/licence');
      setLicences(res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const tabs = [
    { key: 'users' as const, label: 'Users' },
    { key: 'licences' as const, label: 'Licences' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-text">{t('nav.admin')}</h1>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b-2 border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 text-lg font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-3 border-primary text-primary'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="mt-6 overflow-hidden rounded-xl border-2 border-border">
          <table className="w-full">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="px-6 py-4 text-left text-base font-semibold text-text">Name</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text">Email</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text">Role</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text">Status</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-text-secondary">Loading...</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-6 py-4 text-lg font-medium text-text">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-6 py-4 text-base text-text-secondary">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                      user.role === 'Admin' ? 'bg-danger text-white' :
                      user.role === 'Clinician' ? 'bg-primary text-white' :
                      'bg-surface-secondary text-text'
                    }`}>
                      {t(`roles.${user.role.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-base font-medium ${user.isEnabled ? 'text-secondary' : 'text-danger'}`}>
                      {user.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-base text-text-secondary">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Licences tab */}
      {activeTab === 'licences' && (
        <div className="mt-6 overflow-hidden rounded-xl border-2 border-border">
          <table className="w-full">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="px-6 py-4 text-left text-base font-semibold text-text">Key</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text">Type</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text">Therapies</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text">Status</th>
                <th className="px-6 py-4 text-left text-base font-semibold text-text">Expires</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-text-secondary">Loading...</td></tr>
              ) : licences.map((lic) => (
                <tr key={lic.licenceId} className="border-t border-border">
                  <td className="px-6 py-4 font-mono text-base text-text">{lic.licenceKey}</td>
                  <td className="px-6 py-4 text-base text-text-secondary">{lic.type}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {lic.includesVrt && <span className="rounded bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">VRT</span>}
                      {lic.includesNec && <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-secondary">NEC</span>}
                      {lic.includesNet && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-warning">NET</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-base font-medium ${
                      lic.status === 'Active' ? 'text-secondary' :
                      lic.status === 'Expired' ? 'text-text-muted' :
                      'text-danger'
                    }`}>
                      {lic.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-base text-text-secondary">
                    {new Date(lic.expiryDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
