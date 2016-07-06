import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import * as es from '../src';

describe('restore.Session test', function() {
    const data = {
        users: [
            { id: 1, name: 'a' },
            { id: 2, name: 'b' }
        ]
    };

    let session;

    beforeEach(function() {
        session = new es.Session(data);
    });

    it('Retreive data', function() {
        const user1 = session.users.byId(1);
        expect(user1.name).to.eql('a');

        // it's different from data
        expect(user1).to.not.equal(data.users[0]);

        // same on 2nd query
        const user1_reselect = session.users.byId(1);
        expect(user1_reselect).to.equal(user1);
    });

    it('Retain data on no change', function() {
        session.users.byId(1);

        expect(session.commit().dataUpdates).to.eql({});
    });

    it('Update row', function() {
        const user1 = session.users.byId(1);
        user1.name = 'a1';

        const commitedData = session.commit().dataUpdates;

        expect(data.users[0].name).to.eql('a'); // prev state
        expect(commitedData.users[0].name).to.eql('a1'); // commited state
    });

    it('remove row', function() {
        const user1 = session.users.byId(1);

        session.users.remove(user1);

        const commitedData = session.commit().dataUpdates;
        expect(commitedData.users.length).to.eql(1);
    });

  it('create row', function() {
    expect(() => session.users.create({ name: 'q' })).to.throw('id');

    expect(() => session.users.create({ id: 1, name: 'q'})).to.throw('already exist');

    session.users.create({ id: 3, name: 'q' });

    // double creation
    expect(() => session.users.create({ id: 3, name: 'q'})).to.throw('already exist');

    let commitedData = session.commit().dataUpdates;
    expect(commitedData.users.length).to.eql(3);
  });
});