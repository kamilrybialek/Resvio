import React from 'react';
import { Job } from '../../lib/types';
import JobActions from './JobActions';

interface JobCardProps {
  job: Job;
  isApplied?: boolean;
}

export default function JobCard({ job, isApplied = false }: JobCardProps) {
  return (
    <div className={`glass card-hover ${isApplied ? 'applied-job' : ''}`} style={{ 
      padding: '1.5rem', 
      marginBottom: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      opacity: isApplied ? 0.6 : 1,
      border: isApplied ? '1px solid var(--forest)' : '1px solid var(--glass-border)',
      position: 'relative'
    }}>
      {isApplied && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          background: 'var(--forest)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          Applied ✓
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {job.logo && (
            <img src={job.logo} alt={job.company} style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fff' }} />
          )}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.2rem' }}>{job.title}</h3>
            <p style={{ color: 'var(--glacier)', fontSize: '0.85rem' }}>{job.company} • {job.location}</p>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div className="premium-gradient" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            {job.matchScore}%
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--glacier)' }}>Match</p>
        </div>
      </div>

      <p style={{ 
        fontSize: '0.9rem', 
        color: 'var(--mist)', 
        lineHeight: '1.5',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {job.description}
      </p>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {job.tags?.map(tag => (
          <span key={tag} style={{ 
            fontSize: '0.7rem', 
            padding: '3px 8px', 
            borderRadius: '12px', 
            background: 'var(--glass-border)',
            color: 'var(--snow)'
          }}>
            {tag}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--slater)' }}>
          {job.source} • {job.postedAt}
        </span>
        
        <div style={{ width: '100%', maxWidth: '300px' }}>
          <JobActions job={job} />
        </div>
      </div>
    </div>
  );
}
