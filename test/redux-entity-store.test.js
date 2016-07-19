import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import * as es from '../src';

describe('restore.Session test', function() {
    let data, session;

    beforeEach(function() {
        data = {
            users: [
                { id: 1, name: 'user1' },
                { id: 2, name: 'user2' }
            ]
        };

        session = new es.Session(data);
    });

    it('Retreive data', function() {
        const user1 = session.users.byId(1);
        expect(user1.name).to.eql('user1');

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
        user1.name = 'user1_updated';

        const commitedData = session.commit().dataUpdates;

        expect(data.users[0].name).to.eql('user1'); // prev state
        expect(commitedData.users[0].name).to.eql('user1_updated'); // commited state
    });

    it('remove row', function() {
        const user2 = session.users.byId(2);

        session.users.remove(user2);

        const commitedData = session.commit().dataUpdates;

        expect(commitedData.users.length).to.eql(1);
        expect(commitedData.users[0].name).to.eql('user1');
    });

    it('no find after remove', function() {
        let user1 = session.users.byId(1);
        session.users.remove(user1);

        user1 = session.users.byId(1);
        expect(user1).to.eql(null);
    });

    it('create row', function() {
        expect(() => session.users.create({ name: 'user3' })).to.throw('id');

        expect(() => session.users.create({ id: 1, name: 'user3' })).to.throw('already exist');

        session.users.create({ id: 3, name: 'user3' });

        // double creation
        expect(() => session.users.create({ id: 3, name: 'user3' })).to.throw('already exist');

        let commitedData = session.commit().dataUpdates;
        expect(commitedData.users.length).to.eql(3);
    });
});