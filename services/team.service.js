const { TeamMember } = require('../models');
const appState = require('./appState.service');
const authService = require('./auth.service');

class TeamService {
  async ensureSchema() {
    const { sequelize } = require('../models');
    try {
      await sequelize.query('ALTER TABLE team_members ADD COLUMN passwordHash TEXT NULL');
    } catch (error) {
      if (!/duplicate column|duplicate key name|already exists/i.test(error.message || '')) throw error;
    }
  }

  async loadFromDB() {
    await this.ensureSchema();
    const rows = await TeamMember.findAll({ order: [['createdAt', 'ASC']] });
    if (!rows.length) {
      const seeds = appState.list('team').map((member) => member.email === (process.env.ADMIN_EMAIL || 'admin@trustingbrains.com')
        ? { ...member, passwordHash: authService.hashPassword(process.env.ADMIN_PASSWORD || 'change-me') }
        : member);
      await TeamMember.bulkCreate(seeds, { ignoreDuplicates: true });
      return seeds;
    }
    const members = rows.map((row) => row.toJSON());
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@trustingbrains.com';
    const admin = members.find((member) => member.email === adminEmail);
    if (!admin) {
      const seedAdmin = appState.list('team').find((member) => member.role === 'Admin') || {
        id: 'trusting-brains-admin', name: 'Trusting Brains Admin', email: adminEmail, role: 'Admin', avatarColor: 'bg-brand-500', status: 'online', assignedChats: 0, resolvedToday: 0,
      };
      await TeamMember.create({ ...seedAdmin, email: adminEmail, passwordHash: authService.hashPassword(process.env.ADMIN_PASSWORD || 'change-me') });
      members.push({ ...seedAdmin, email: adminEmail, passwordHash: authService.hashPassword(process.env.ADMIN_PASSWORD || 'change-me') });
    } else if (process.env.ADMIN_PASSWORD && !admin.passwordHash) {
      admin.passwordHash = authService.hashPassword(process.env.ADMIN_PASSWORD);
      await TeamMember.update({ passwordHash: admin.passwordHash }, { where: { id: admin.id } });
    }
    appState.setTeam(members);
    return members;
  }

  async create(member) {
    await TeamMember.create(member);
    return member;
  }
}

module.exports = new TeamService();
