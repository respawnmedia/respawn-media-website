import React, {useEffect, useState} from 'react';
import Arrow from './Arrow';
import './careers.css';

const liveCareers = '/careers';
const workTypes = [
  {id: '', label: 'All work types'},
  {id: 'FULL-TIME', label: 'Full-time'},
  {id: 'FREELANCE', label: 'Freelance'},
];


export default function Careers() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/careers/config', {signal: controller.signal})
      .then(response => {
        if (!response.ok) throw new Error('Careers request failed');
        return response.json();
      })
      .then(result => {
        if (!result.ok || !Array.isArray(result.data?.roles)) throw new Error('Invalid careers response');
        setConfig(result.data);
      })
      .catch(error => {
        if (error.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, []);
  const allRoles = config?.roles || [];
  const departments = [...new Set(allRoles.map(role => role.department).filter(Boolean))];
  const locations = [...new Set(allRoles.map(role => role.location).filter(Boolean))];
  const [type, setType] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const roles = allRoles.filter(role =>
    (!type || role.category === type) &&
    (!department || role.department === department) &&
    (!location || role.location === location)
  );

  return <>
    <header className="careers-hero">
      <p className="eyebrow">Respawn / Careers + collaborators</p>
      <h1>Make good stuff<br/><em>with us.</em></h1>
      <p>{config?.settings?.hero_description || 'Full-time roles, paid internships and freelance collaborations for people who care about content, culture and craft.'}</p>
      <div className="careers-actions">
        <a className="cta" href="#roles">View open roles <Arrow direction="down"/></a>
        <a className="careers-secondary" href="#roles" onClick={() => {setType('FREELANCE'); setDepartment(''); setLocation('');}}>Explore freelance roles <Arrow direction="down"/></a>
      </div>
    </header>
    <section id="roles" className="careers-roles">
      <p className="eyebrow">Open roles</p>
      <h2>Find your fit.</h2>
      <div className="careers-filters">
        <label>Work type<select value={type} onChange={event => setType(event.target.value)}>
          {workTypes.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select></label>
        <label>Department<select value={department} onChange={event => setDepartment(event.target.value)}>
          <option value="">All departments</option>
          {departments.map(item => <option key={item} value={item}>{item}</option>)}
        </select></label>
        <label>Location<select value={location} onChange={event => setLocation(event.target.value)}>
          <option value="">All locations</option>
          {locations.map(item => <option key={item}>{item}</option>)}
        </select></label>
      </div>
      <p className="careers-count" role="status">{error ? 'The careers list could not load. Please try again shortly.' : !config ? 'Loading roles…' : roles.length + (roles.length === 1 ? ' role' : ' roles')}</p>
      <div className="careers-grid">
        {roles.map(role => <RoleCard key={role.slug} role={role}/>)}
      </div>
      {config && !roles.length && <p>Try a different work type, department, or location.</p>}
      {error && <p className="careers-listing-link"><a href="mailto:respawnmediain@gmail.com">Email us about opportunities <Arrow/></a></p>}
    </section>
    <section className="careers-freelance">
      <p className="eyebrow">Collaborate with us</p>
      <h2>The freelance network.</h2>
      <p>{config?.settings?.freelance_intro || 'We’re building a dependable network of creators and production talent for campaigns, shoots, and recurring client work.'}</p>
      <a className="careers-secondary" href="#roles" onClick={() => {setType('FREELANCE'); setDepartment(''); setLocation('');}}>Browse freelance roles <Arrow direction="up"/></a>
    </section>
  </>;
}

function RoleCard({role}) {
  const type = workTypes.find(option => option.id === role.category)?.label || role.category;
  const canApply = role.accepting_applications && role.status !== 'CLOSED';
  return <article className="careers-role">
    <div className="careers-role-meta"><span>{type}</span><span>{role.location}</span></div>
    <h3>{role.title}</h3>
    <p>{[role.department, role.work_mode, role.experience].filter(Boolean).join(' · ')}</p>
    <p>{role.short_description}</p>
    <details>
      <summary>Role details</summary>
      <p>{role.full_description}</p>
      {role.requirements?.length > 0 && <ul>{role.requirements.map(item => <li key={item.requirement_id}>{item.requirement}</li>)}</ul>}
    </details>
    {canApply
      ? <a className="careers-apply" href={liveCareers + '/apply/' + encodeURIComponent(role.slug)} aria-label={'Apply for ' + role.title}>Apply <Arrow/></a>
      : <p>Applications closed</p>}
  </article>;
}
