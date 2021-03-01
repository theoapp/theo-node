export const parseSSHOptions = function (row) {
  if (row.ssh_options) {
    row.ssh_options = JSON.parse(row.ssh_options);
  } else {
    row.ssh_options = false;
  }
  return row;
};

export const parseKeySSHOptions = function (row) {
  if (row.key_ssh_options) {
    row.key_ssh_options = JSON.parse(row.key_ssh_options);
  } else {
    row.key_ssh_options = false;
  }
  return row;
};

export const calculateDistance = function (matchLen, r) {
  const permissionLen = r.host.length + r.user.length;
  const distance = matchLen - permissionLen;
  r.distance = distance <= 0 ? 0 : distance;
};

export const mergeSSHOptions = function (a, b) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  const ret = {};
  if (a.from || b.from) {
    ret.from = [...new Set((a.from || []).concat(b.from || []))];
  }
  if (a.permitopen || b.permitopen) {
    ret.permitopen = [...new Set((a.permitopen || []).concat(b.permitopen || []))];
  }
  if (a.environment || b.environment) {
    ret.environment = [...new Set((a.environment || []).concat(b.environment || []))];
  }
  if (a.command || b.command) {
    ret.command = a.command || b.command;
  }
  if (a.restrict || b.restrict) {
    ret.restrict = true;
  }
  if (a['no-agent-forwarding'] || b['no-agent-forwarding']) {
    ret['no-agent-forwarding'] = true;
  }
  if (a['agent-forwarding'] || b['agent-forwarding']) {
    ret['agent-forwarding'] = true;
  }
  if (a['no-port-forwarding'] || b['no-port-forwarding']) {
    ret['no-port-forwarding'] = true;
  }
  if (a['port-forwarding'] || b['port-forwarding']) {
    ret['port-forwarding'] = true;
  }
  if (a['no-pty'] || b['no-pty']) {
    ret['no-pty'] = true;
  }
  if (a.pty || b.pty) {
    ret.pty = true;
  }
  if (a['no-user-rc'] || b['no-user-rc']) {
    ret['no-user-rc'] = true;
  }
  if (a['user-rc'] || b['user-rc']) {
    ret['user-rc'] = true;
  }
  if (a['no-X11-forwarding'] || b['no-X11-forwarding']) {
    ret['no-X11-forwarding'] = true;
  }
  if (a['X11-forwarding'] || b['X11-forwarding']) {
    ret['X11-forwarding'] = true;
  }
  return ret;
};

export const renderSSHOptions = function (ssh_options) {
  const ret = [];
  if (ssh_options.from?.length > 0) {
    ret.push(`from="${ssh_options.from.join(',')}"`);
  }
  if (ssh_options.permitopen?.length > 0) {
    ret.push(`permitopen="${ssh_options.permitopen.join(',')}"`);
  }
  if (ssh_options.environment?.length > 0) {
    ret.push(`environment="${ssh_options.environment.join(',')}"`);
  }
  if (ssh_options.command) {
    ret.push(`command="${ssh_options.command}"`);
  }
  if (ssh_options.restrict) {
    ret.push('restrict');
    if (ssh_options['agent-forwarding']) {
      ret.push('agent-forwarding');
    }
    if (ssh_options['port-forwarding']) {
      ret.push('port-forwarding');
    }
    if (ssh_options.pty) {
      ret.push('pty');
    }
    if (ssh_options['user-rc']) {
      ret.push('user-rc');
    }
    if (ssh_options['X11-forwarding']) {
      ret.push('X11-forwarding');
    }
  } else {
    if (ssh_options['no-agent-forwarding']) {
      ret.push('no-agent-forwarding');
    }
    if (ssh_options['no-port-forwarding']) {
      ret.push('no-port-forwarding');
    }
    if (ssh_options['no-pty']) {
      ret.push('no-pty');
    }
    if (ssh_options['no-user-rc']) {
      ret.push('no-user-rc');
    }
    if (ssh_options['no-X11-forwarding']) {
      ret.push('no-X11-forwarding');
    }
  }
  return ret.join(',');
};
