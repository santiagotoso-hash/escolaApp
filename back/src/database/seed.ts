/**
 * Dados de demonstração: uma escola com direção, 2 professores, 3 famílias,
 * turmas, alunos, comunicados, eventos e uma conversa.
 *
 *   npm run seed
 *
 * APAGA todas as tabelas antes de inserir. Não rode contra o banco de produção.
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Aluno } from '../alunos/aluno.entity';
import { Papel } from '../common/enums/papel.enum';
import { CienciaComunicado } from '../comunicados/ciencia-comunicado.entity';
import {
  CategoriaComunicado,
  Comunicado,
} from '../comunicados/comunicado.entity';
import { typeormOptions } from '../config/typeorm.options';
import { Evento, TipoEvento } from '../eventos/evento.entity';
import { Conversa } from '../mensagens/conversa.entity';
import { Mensagem } from '../mensagens/mensagem.entity';
import { Turma, Turno } from '../turmas/turma.entity';
import { Usuario } from '../usuarios/usuario.entity';

const SENHA_DEMO = 'Senha@123';

/** Data relativa a hoje, às `hora` horas. */
function emDias(dias: number, hora = 8) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, 0, 0, 0);
  return d;
}

async function main() {
  const ds = new DataSource({
    ...typeormOptions((k) => process.env[k]),
    synchronize: true,
  });
  await ds.initialize();
  console.log('Conectado. Limpando tabelas...');
  const tabelas = ds.entityMetadatas.map((m) => `"${m.tableName}"`).join(', ');
  await ds.query(`TRUNCATE ${tabelas} RESTART IDENTITY CASCADE`);

  const senhaHash = await bcrypt.hash(SENHA_DEMO, 10);
  const usuarios = ds.getRepository(Usuario);
  const criar = (nome: string, email: string, papel: Papel, telefone?: string) =>
    usuarios.save(
      usuarios.create({ nome, email, papel, senhaHash, telefone: telefone ?? null }),
    );

  const diretora = await criar('Ana Paula Ribeiro', 'direcao@escolaconecta.com.br', Papel.ADMIN);
  const profCarla = await criar('Carla Mendes', 'carla@escolaconecta.com.br', Papel.PROFESSOR);
  const profRoberto = await criar('Roberto Lima', 'roberto@escolaconecta.com.br', Papel.PROFESSOR);
  const maria = await criar('Maria Souza', 'maria@email.com', Papel.RESPONSAVEL, '(11) 98765-4321');
  const joao = await criar('João Souza', 'joao@email.com', Papel.RESPONSAVEL, '(11) 91234-5678');
  const fernanda = await criar('Fernanda Oliveira', 'fernanda@email.com', Papel.RESPONSAVEL, '(21) 99876-1234');

  const ano = new Date().getFullYear();
  const turmas = ds.getRepository(Turma);
  const quintoA = await turmas.save(
    turmas.create({ nome: '5º Ano A', anoLetivo: ano, turno: Turno.MANHA, professores: [profCarla] }),
  );
  const segundoB = await turmas.save(
    turmas.create({ nome: '2º Ano B', anoLetivo: ano, turno: Turno.TARDE, professores: [profRoberto] }),
  );

  const alunos = ds.getRepository(Aluno);
  const lucas = await alunos.save(
    alunos.create({ nome: 'Lucas Souza', matricula: `${ano}-0001`, dataNascimento: '2016-03-14', turma: quintoA, responsaveis: [maria, joao] }),
  );
  await alunos.save(
    alunos.create({ nome: 'Beatriz Souza', matricula: `${ano}-0002`, dataNascimento: '2019-08-02', turma: segundoB, responsaveis: [maria, joao] }),
  );
  await alunos.save(
    alunos.create({ nome: 'Gabriel Oliveira', matricula: `${ano}-0003`, dataNascimento: '2016-11-21', turma: quintoA, responsaveis: [fernanda] }),
  );

  const comunicados = ds.getRepository(Comunicado);
  const reuniao = await comunicados.save(
    comunicados.create({
      titulo: 'Reunião de pais e mestres',
      conteudo:
        'Convidamos todas as famílias para a reunião de pais e mestres do bimestre, ' +
        'no auditório da escola. Vamos apresentar o desempenho das turmas e o calendário ' +
        'das próximas avaliações. Por favor, confirme a ciência deste comunicado.',
      categoria: CategoriaComunicado.EVENTO,
      exigeCiencia: true,
      autor: diretora,
      turma: null,
    }),
  );
  await comunicados.save([
    comunicados.create({
      titulo: 'Material para a aula de Ciências',
      conteudo:
        'Na próxima semana faremos um experimento sobre germinação. Cada aluno deve ' +
        'trazer um copo plástico, algodão e 5 grãos de feijão.',
      categoria: CategoriaComunicado.PEDAGOGICO,
      autor: profCarla,
      turma: quintoA,
    }),
    comunicados.create({
      titulo: 'Vacinação contra a gripe',
      conteudo:
        'A UBS do bairro fará vacinação na escola. Envie a carteirinha de vacinação ' +
        'na mochila e assine a autorização até sexta-feira.',
      categoria: CategoriaComunicado.URGENTE,
      exigeCiencia: true,
      autor: diretora,
      turma: null,
    }),
  ]);
  await ds.getRepository(CienciaComunicado).save({ comunicado: reuniao, usuario: fernanda });

  const eventos = ds.getRepository(Evento);
  await eventos.save([
    eventos.create({ titulo: 'Reunião de pais e mestres', tipo: TipoEvento.REUNIAO, inicio: emDias(5, 19), fim: emDias(5, 21), local: 'Auditório' }),
    eventos.create({ titulo: 'Prova de Matemática', tipo: TipoEvento.PROVA, inicio: emDias(8, 8), turma: quintoA, descricao: 'Conteúdo: frações e números decimais.' }),
    eventos.create({ titulo: 'Passeio ao Zoológico', tipo: TipoEvento.PASSEIO, inicio: emDias(12, 7), fim: emDias(12, 16), turma: segundoB, local: 'Saída do portão principal', descricao: 'Enviar lanche e boné. Autorização assinada obrigatória.' }),
    eventos.create({ titulo: 'Festa Junina', tipo: TipoEvento.FESTA, inicio: emDias(20, 14), fim: emDias(20, 20), local: 'Quadra da escola' }),
  ]);

  const conversa = await ds.getRepository(Conversa).save({
    assunto: 'Saída antecipada na sexta',
    aluno: lucas,
    responsavel: maria,
    ultimaMensagemEm: new Date(),
    ultimaDaEscola: true,
    lidaPelaFamiliaEm: null,
    lidaPelaEscolaEm: new Date(),
  });
  const mensagens = ds.getRepository(Mensagem);
  await mensagens.save(mensagens.create({ conversa, autor: maria, texto: 'Bom dia, professora! Na sexta o Lucas vai sair às 10h para uma consulta médica. O pai vai buscar.' }));
  await mensagens.save(mensagens.create({ conversa, autor: profCarla, texto: 'Bom dia, Maria! Anotado. Vou deixar a lição de casa separada para ele. Obrigada por avisar!' }));

  console.log(`\nPronto! Todos os usuários têm a senha: ${SENHA_DEMO}`);
  console.table([
    { papel: 'Direção', email: diretora.email },
    { papel: 'Professora 5º A', email: profCarla.email },
    { papel: 'Professor 2º B', email: profRoberto.email },
    { papel: 'Mãe (Lucas e Beatriz)', email: maria.email },
    { papel: 'Pai (Lucas e Beatriz)', email: joao.email },
    { papel: 'Mãe (Gabriel)', email: fernanda.email },
  ]);
  await ds.destroy();
}

main().catch((erro) => {
  console.error('Falha no seed:', erro);
  process.exit(1);
});
