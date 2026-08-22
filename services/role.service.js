const { Role } = require('../models');
const appState = require('./appState.service');

class RoleService {
  async loadFromDB() {
    const rows = await Role.findAll({ order: [['createdAt', 'ASC']] });
    if (!rows.length) {
      const defaults = appState.list('roles');
      await Role.bulkCreate(defaults, { ignoreDuplicates: true });
      return defaults;
    }
    const roles = rows.map((row) => row.toJSON());
    appState.setRoles(roles);
    return roles;
  }
  async create(role) { await Role.create(role); return role; }
  async update(id, patch) { await Role.update(patch, { where: { id } }); return (await Role.findByPk(id))?.toJSON() || null; }
}

module.exports = new RoleService();
