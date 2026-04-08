import React, { Suspense } from 'react';
import Sidebar from './components/Sidebar';
import JobCard from './components/JobCard';
import SearchHeader from './components/SearchHeader';
import { JobService } from '@/lib/services/job-service';
import { ProfileService } from '@/lib/services/profile-service';

interface PageProps {
  searchParams: Promise<{ q?: string; l?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const { q, l } = await searchParams;
  
  // Only fetch jobs if a query or location is provided
  const hasSearch = Boolean(q || l);
  const jobs = hasSearch ? await JobService.fetchAllJobs(l || '', q || '') : [];
  const profile = ProfileService.getProfile();
  const appliedJobs = profile?.appliedJobs || [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <main style={{ 
        marginLeft: '320px', 
        padding: '2rem 4rem', 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.4rem' }}>
              Welcome back, <span className="premium-gradient">{profile?.name?.split(' ')[0] || 'User'}</span>
            </h2>
            <p style={{ color: 'var(--glacier)', fontSize: '1rem' }}>
              {hasSearch 
                ? jobs.length > 0 ? `We curated ${jobs.length} tailored opportunities for you.` : 'No positions found matching your criteria. Try adjusting your search.'
                : 'Enter keywords and location to start finding tailored opportunities.'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="glass card-hover" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: '600' }}>
              Edit Base CV
            </button>
            <button style={{ 
              padding: '0.6rem 1.2rem', 
              background: 'var(--glass-border)', 
              color: 'var(--snow)', 
              borderRadius: '10px',
              fontWeight: '600',
              border: '1px solid var(--glass-border)',
              fontSize: '0.9rem'
            }}>
              Job History
            </button>
          </div>
        </header>

        <Suspense fallback={<div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>Loading search filters...</div>}>
          <SearchHeader />
        </Suspense>

        <section style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Recommended for you</h3>
            <div style={{ color: 'var(--glacier)', fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
              <span>Sort: <strong>Highest Match</strong></span>
              <span>Source: <strong>All</strong></span>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
            {jobs.map(job => (
              <JobCard key={job.id} job={job} isApplied={appliedJobs.includes(job.id)} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

