import { describe, it, expect } from 'vitest';
import { transitionSession, transitionNodeState } from '../learner/state-machines.js';
import { AppError } from '../errors.js';

describe('transitionSession', () => {
  it('none -> active on start', () => {
    expect(transitionSession(null, 'start')).toBe('active');
  });

  it('throws on invalid initial event', () => {
    expect(() => transitionSession(null, 'pause')).toThrow(AppError);
  });

  it('active -> paused on pause', () => {
    expect(transitionSession('active', 'pause')).toBe('paused');
  });

  it('active -> completed on complete', () => {
    expect(transitionSession('active', 'complete')).toBe('completed');
  });

  it('active -> abandoned on abandon', () => {
    expect(transitionSession('active', 'abandon')).toBe('abandoned');
  });

  it('paused -> active on resume', () => {
    expect(transitionSession('paused', 'resume')).toBe('active');
  });

  it('paused -> abandoned on abandon', () => {
    expect(transitionSession('paused', 'abandon')).toBe('abandoned');
  });

  it('throws on invalid transition: completed -> pause', () => {
    expect(() => transitionSession('completed', 'pause')).toThrow(AppError);
  });

  it('throws on invalid transition: abandoned -> resume', () => {
    expect(() => transitionSession('abandoned', 'resume')).toThrow(AppError);
  });

  it('throws on invalid transition: active -> start', () => {
    expect(() => transitionSession('active', 'start')).toThrow(AppError);
  });
});

describe('transitionNodeState', () => {
  it('unseen -> studying on start_study', () => {
    expect(transitionNodeState('unseen', 'start_study')).toBe('studying');
  });

  it('studying -> passed on pass', () => {
    expect(transitionNodeState('studying', 'pass')).toBe('passed');
  });

  it('studying -> remediation on fail_remediation', () => {
    expect(transitionNodeState('studying', 'fail_remediation')).toBe('remediation');
  });

  it('remediation -> studying on resume_study', () => {
    expect(transitionNodeState('remediation', 'resume_study')).toBe('studying');
  });

  it('passed -> mastered on master', () => {
    expect(transitionNodeState('passed', 'master')).toBe('mastered');
  });

  it('passed -> studying on review', () => {
    expect(transitionNodeState('passed', 'review')).toBe('studying');
  });

  it('mastered -> studying on review', () => {
    expect(transitionNodeState('mastered', 'review')).toBe('studying');
  });

  it('throws on invalid transition: unseen -> pass', () => {
    expect(() => transitionNodeState('unseen', 'pass')).toThrow(AppError);
  });

  it('throws on invalid transition: mastered -> pass', () => {
    expect(() => transitionNodeState('mastered', 'pass')).toThrow(AppError);
  });

  it('throws on invalid transition: remediation -> pass', () => {
    expect(() => transitionNodeState('remediation', 'pass')).toThrow(AppError);
  });

  it('throws INVALID_TRANSITION error code', () => {
    try {
      transitionNodeState('unseen', 'pass');
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe('INVALID_TRANSITION');
    }
  });
});
