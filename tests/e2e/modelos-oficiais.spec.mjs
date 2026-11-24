import { abrirServico, expect, preencherObrigatorios, test } from '../support/pagina.mjs';

// Textos exatos combinados com o responsável. Se mudarem, foi de propósito: atualize aqui junto.
const preencher = (page, campos) =>
  page.evaluate((c) => {
    for (const [k, v] of Object.entries(c)) document.getElementById(k).value = v;
  }, campos);
const gerar = (page, sf) => page.locator(`#${sf} > .actions .btn:not(.btn-clear):not(.btn-edit)`).first().click();
const nota = (page) => page.inputValue('#out-nota');
const agenda = (page) => page.inputValue('#out-agenda');

test('Ligação Nova normal', async ({ page }) => {
  await abrirServico(page, 'sf-ligacao-nova');
  await preencher(page, {
    ln_solic: 'Stephanie Souza',
    ln_tel: '71993501519',
    ln_numero: '77',
    ln_compl: 'ap 101',
    ln_ref: 'px ao beco do sirilo',
    ln_coords: '-12.958584819888278, -38.495534908027274',
    ln_email: 'Não informado',
    ln_proc: 'Stephanie',
  });
  await gerar(page, 'sf-ligacao-nova');
  expect(await nota(page)).toBe(
    'LN MONO N° 77 AP 101 REF: PX AO BECO DO SIRILO CG: -12.958584819888278, -38.495534908027274 TEL: 71-993501519 PC: STEPHANIE PZ 5D UTEIS',
  );
});

test('Ligação Nova por expediente', async ({ page }) => {
  await abrirServico(page, 'sf-ligacao-nova');
  await page.evaluate(() => {
    const s = document.getElementById('ln_modo');
    s.value = 'expediente';
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await preencher(page, {
    ln_solic: 'Stephanie',
    ln_tel: '71993501519',
    ln_num_nota: '300123456',
    ln_emp: 'Residencial Sol',
    ln_ap: '101',
    ln_bloco: 'B',
    ln_ref: 'PX AO BECO',
    ln_coords: 'Não informado',
    ln_email: 'st@email.com',
    ln_proc: 'Stephanie',
  });
  await gerar(page, 'sf-ligacao-nova');
  expect(await nota(page)).toBe('LN MONO LIB P/AE 300123456 AP 101 BL B REF: PX AO BECO TEL: 71-993501519 PC: STEPHANIE/st@email.com PZ 5D UTEIS');
  expect(await agenda(page)).toContain('Nome do Empreendimento: Residencial Sol');
});

test('Reativação: nota e agenda', async ({ page }) => {
  await abrirServico(page, 'sf-reativ-comum');
  await preencher(page, {
    rtc_solic: 'Stephanie Souza',
    rtc_tel: '71993501519',
    rtc_numero: '77',
    rtc_compl: 'AP 101',
    rtc_ref: 'PX AO BECO DO SIRILO',
    rtc_coords: '-12.958584819888278, -38.495534908027274',
    rtc_email: 'Não informado',
    rtc_proc: 'PORTARIA',
  });
  await gerar(page, 'sf-reativ-comum');
  expect(await nota(page)).toBe(
    'RT MONO N° 77 AP 101 REF: PX AO BECO DO SIRILO CG: -12.958584819888278, -38.495534908027274 TEL: 71-993501519 PC: PORTARIA PZ 5D UTEIS',
  );
  expect((await agenda(page)).split('\n')).toEqual([
    'Tipo de solicitação: Reativação',
    'Solicitante: Stephanie Souza',
    'Pontos de referências: PX AO BECO DO SIRILO',
    'Coordenadas geográficas: -12.958584819888278, -38.495534908027274',
    'Tipo de ligação: MONO',
    'Telefones para contato: (71) 99350-1519',
    'E-mail para contato: Não informado',
    'Dados da receita: (regular/pendente de regularização): REGULAR',
    'Quem deverá ser procurado no local: PORTARIA',
    'Ciente do prazo de 5 dias úteis para execução do serviço',
  ]);
});

test('Isenção de Débitos (pedido de análise)', async ({ page }) => {
  await abrirServico(page, 'sf-analise-isencao');
  await preencher(page, {
    aid_cc: '7001234567',
    aid_pn: '1010000001',
    aid_solic: 'Maria Teste',
    aid_doc: '12345678901',
    aid_tel: '71993501519',
    aid_email: 'maria@email.com',
    aid_docs: 'escritura e cnh',
  });
  await gerar(page, 'sf-analise-isencao');
  expect(await nota(page)).toBe(
    'Análise de isenção de debitos\nConta contrato: 7001234567\nSolicitante: MARIA TESTE\nCPF/CNPJ: 123.456.789-01\nPN: 1010000001\nTEL: 71-993501519\nEMAIL: maria@email.com\nDOCUMENTAÇÃO APRESENTADA: ESCRITURA E CNH.',
  );
});

for (const [id, titulo] of [
  ['sf-isencao-deb|troca', 'TROCA DE TITULARIDADE COM ANÁLISE DE ISENÇÃO DE DÉBITOS'],
  ['sf-isencao-deb|reativacao', 'REATIVAÇÃO COM ANÁLISE DE ISENÇÃO DE DÉBITOS'],
]) {
  test(`Análise de isenção — título ${titulo.split(' ')[0]}`, async ({ page }) => {
    await abrirServico(page, id);
    await preencher(page, {
      ise_solic: 'Ana',
      ise_doc: '12345678901',
      ise_tel: '71993501519',
      ise_email: 'Não informado',
      ise_cca: '1',
      ise_ccn: '2',
      ise_leitura: '1',
      ise_deb_total: '100,00',
      ise_doc_posse: 'Contrato de locação',
      ise_periodo_final: 'Não se aplica',
      ise_forma: 'Não se aplica',
    });
    await gerar(page, 'sf-isencao-deb');
    const t = await nota(page);
    expect(t.split('\n')[0]).toBe(`Título: ${titulo}`);
    expect(t).toContain('Período (de/até): Não se aplica');
  });
}

test('Ressarcimento de Danos: títulos do Texto Padrão Lojas', async ({ page }) => {
  for (const [sf, t] of [
    ['sf-danos-eletricos', 'RESSARCIMENTO DE DANOS ELÉTRICOS - ABERTURA DE NOTA'],
    ['sf-rde-doc', 'RESSARCIMENTO DE DANOS ELÉTRICOS - RECEBIMENTO DE DOCUMENTAÇÃO'],
    ['sf-outros-danos', 'RESSARCIMENTO DE DANOS NÃO ELÉTRICOS'],
  ]) {
    await abrirServico(page, sf);
    await preencherObrigatorios(page, sf);
    await gerar(page, sf);
    expect(((await nota(page)) || (await agenda(page))).split('\n')[0]).toBe(`Título: ${t}`);
  }
});

test('nenhum texto usa forma de tratamento (Sr./Sra.)', async ({ page }) => {
  const rotulos = await page.$$eval('#painel_agenda label', (ls) => ls.map((l) => l.textContent).filter((t) => /\bSr\(a\)|Sr\. ou Sra/.test(t)));
  expect(rotulos).toEqual([]);
});

test('Atualização Cadastral: os três motivos', async ({ page }) => {
  const escolher = (v) =>
    page.evaluate((v) => {
      const s = document.getElementById('ac_motivo');
      s.value = v;
      s.dispatchEvent(new Event('change', { bubbles: true }));
    }, v);
  await abrirServico(page, 'sf-atualizacao-cadastral');
  await expect(page.locator('#alerta_ac_nome')).toBeHidden();
  await preencher(page, { ac_nome: 'Maria Teste', ac_tel: '71993501519', ac_email: 'maria@email.com', ac_rg: '1234567', ac_cnh: '', ac_id: '' });
  await gerar(page, 'sf-atualizacao-cadastral');
  expect(await nota(page)).toBe(
    'Gentileza Atualizar Cadastro\nMotivo: Erro de Endereço\nNome: Maria Teste\nTelefone: (71) 99350-1519\nE-mail: maria@email.com\nRG: 1234567',
  );

  await page.evaluate(() => window.limparForm('sf-atualizacao-cadastral'));
  await escolher('Unificar PN');
  await expect(page.locator('#ac_pns')).toBeVisible();
  await preencher(page, { ac_pns: '1010000001, 1010000002', ac_nome: 'Maria Teste', ac_tel: '71993501519', ac_email: 'Não informado' });
  await gerar(page, 'sf-atualizacao-cadastral');
  expect((await nota(page)).split('\n').slice(0, 3)).toEqual(['Gentileza Atualizar Cadastro', 'Motivo: Unificar PN', 'PNs: 1010000001, 1010000002']);

  await page.evaluate(() => window.limparForm('sf-atualizacao-cadastral'));
  await escolher('Correção de Nome');
  await expect(page.locator('#alerta_ac_nome')).toContainText('OneCode (2º Nível)');
  await expect(page.locator('#ac_pns')).toBeHidden();
});
