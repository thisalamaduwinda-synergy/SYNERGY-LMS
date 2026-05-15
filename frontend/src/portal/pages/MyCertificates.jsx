import React, { useState, useEffect } from 'react';
import { Award, Calendar, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MyCertificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/v1/certificates/user/${user.id}`)
      .then((r) => setCertificates(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="up-loading">Loading certificates...</div>;

  return (
    <div>
      <div className="up-page-header">
        <h1>My Certificates</h1>
        <p>Certificates you have earned by completing trainings</p>
      </div>

      {certificates.length === 0 ? (
        <div className="up-empty">
          <Award size={48} />
          <h3>No certificates yet</h3>
          <p>Complete a training quiz to earn your first certificate</p>
        </div>
      ) : (
        <div className="up-cert-grid">
          {certificates.map((cert) => (
            <div key={cert.id} className="up-cert-card">
              <div className="up-cert-badge">
                <Award size={32} />
              </div>
              <div className="up-cert-body">
                <div className="up-cert-title">{cert.course_title || 'Training Certificate'}</div>
                {cert.course_department && (
                  <div className="up-cert-dept">
                    <BookOpen size={13} /> {cert.course_department}
                  </div>
                )}
                <div className="up-cert-number">
                  Certificate No: <strong>{cert.certificate_number}</strong>
                </div>
                <div className="up-cert-meta">
                  <span><Calendar size={13} /> Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}</span>
                  {cert.valid_until && (
                    <span>Expires: {new Date(cert.valid_until).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="up-cert-status valid">Valid</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
