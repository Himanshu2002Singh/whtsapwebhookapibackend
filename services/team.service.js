const { TeamMember } = require('../models');
const appState = require('./appState.service');

class TeamService {
  async loadFromDB() {
    const rows = await TeamMember.findAll({ order: [['createdAt', 'ASC']] });
    if (!rows.length) {
      const seeds = appState.list('team');
      await TeamMember.bulkCreate(seeds, { ignoreDuplicates: true });
      return seeds;
    }
    const members = rows.map((row) => row.toJSON());
    appState.setTeam(members);
    return members;
  }

  async create(member) {
    await TeamMember.create(member);
    return member;
  }
}

module.exports = new TeamService();
