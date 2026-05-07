const fs = require('fs');
const c = fs.readFileSync('g:/My Projects/BlinkOpticals/public/admin/js/erp-views.js', 'utf8');
const fns = ['load_comm', 'switchCommTab', 'executeCampaign', 'openNewCampaignModal', 
              'openNewGroupModal', 'openNewTemplateModal', '_renderCampaigns', '_renderGroups',
              '_renderTemplates', '_renderCommLogs', 'load_campaigns'];

fns.forEach(f => {
    const pattern = new RegExp('(window\\.' + f + '\\s*=|function ' + f + ')', 'g');
    const hits = (c.match(pattern) || []);
    const status = hits.length > 1 ? '⚠️  DUPLICATE' : hits.length === 0 ? '❌ MISSING' : '✅ OK';
    console.log(status, f + ':', hits.length);
});

console.log('\nTotal file size:', Math.round(c.length / 1024) + 'KB', '(' + c.split('\n').length + ' lines)');
process.exit(0);
