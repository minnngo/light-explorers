import { describe, expect, it } from 'vitest';
import { editingOwner, EMPTY_PRESENCE, type LivePeer, memberColor, tallyVotes } from './live';

const minsu = { id: 'a1', name: '민수' };
const jia = { id: 'b2', name: '지아' };
const dohyun = { id: 'c3', name: '도현' };
const peer = (member: typeof jia, patch: Partial<LivePeer> = {}): LivePeer => ({
  ...EMPTY_PRESENCE, member, color: memberColor(member.id), at: 0, ...patch,
});

describe('모두 동의', () => {
  it('들어와 있는 모둠원이 모두 같은 답을 골라야 정해진다', () => {
    const members = [minsu, jia, dohyun];
    const field = 'predict-streetlight';
    const peers = [peer(jia, { vote: { field, value: 'a' } }), peer(dohyun, { vote: { field, value: 'b' } })];
    expect(tallyVotes(field, minsu, 'a', peers, members)).toMatchObject({ agreed: null, same: 2 });
    peers[1] = peer(dohyun, { vote: { field, value: 'a' } });
    expect(tallyVotes(field, minsu, 'a', peers, members)).toMatchObject({ agreed: 'a', same: 3 });
  });

  it('아직 고르지 않은 친구가 있거나 다른 문제의 표는 세지 않는다', () => {
    const peers = [peer(jia, { vote: { field: 'predict-fan', value: 'a' } })];
    expect(tallyVotes('predict-streetlight', minsu, 'a', peers, [minsu, jia]).agreed).toBeNull();
  });

  it('나간 친구(presence에 없음)는 세지 않는다', () => {
    expect(tallyVotes('f', minsu, 'c', [peer(jia)], [minsu]).agreed).toBe('c');
  });
});

describe('쓰는 중 잠금', () => {
  it('친구가 쓰고 있으면 그 친구가 보인다', () => {
    expect(editingOwner('reason', { id: minsu.id, editing: null }, [peer(jia, { editing: 'reason' })])).toEqual(jia);
    expect(editingOwner('other', { id: minsu.id, editing: null }, [peer(jia, { editing: 'reason' })])).toBeNull();
  });

  it('동시에 누르면 id가 앞선 사람이 쓴다 (모든 기기가 같은 결론)', () => {
    // 민수(a1) 화면: 지아(b2)보다 앞서니 민수가 쓴다
    expect(editingOwner('reason', { id: minsu.id, editing: 'reason' }, [peer(jia, { editing: 'reason' })])).toBeNull();
    // 지아 화면: 민수에게 잠긴다
    expect(editingOwner('reason', { id: jia.id, editing: 'reason' }, [peer(minsu, { editing: 'reason' })])).toEqual(minsu);
  });
});
