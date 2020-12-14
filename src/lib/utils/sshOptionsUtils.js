export const parseSSHOptions = function(row) {
  if (row.ssh_options) {
    row.ssh_options = JSON.parse(row.ssh_options);
  } else {
    row.ssh_options = '';
  }
  return row;
};

export const mergeSSHOptions = function(a, b) {
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
  if (a['no-agent-forwarding'] || b['no-agent-forwarding']) {
    ret['no-agent-forwarding'] = true;
  }
  if (a['no-port-forwarding'] || b['no-port-forwarding']) {
    ret['no-port-forwarding'] = true;
  }
  if (a['no-pty'] || b['no-pty']) {
    ret['no-pty'] = true;
  }
  if (a['no-user-rc'] || b['no-user-rc']) {
    ret['no-user-rc'] = true;
  }
  if (a['no-x11-forwarding'] || b['no-x11-forwarding']) {
    ret['no-x11-forwarding'] = true;
  }
  return ret;
};

export const renderSSHOptions = function(ssh_options) {
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
  if (ssh_options['no-x11-forwarding']) {
    ret.push('no-x11-forwarding');
  }
  return ret.join(',');
};
