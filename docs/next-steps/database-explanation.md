# VISÃO GERAL
Bom, primeira coisa, uma visão geral, é que nós temos os prefixos muito bem definidos para as tabelas do banco de dados. Onde structure, eu sempre coloco algo que é mais fixo, que é algo que é mais estrutural do sistema. Ou seja, não tem a ver com a produção em si. production, obviamente são as etapas ali de produção são mais relacionadas às etapas de produção dos vídeos narrative foi uma sugestão do Claude na época, talvez eu colocaria na parte de estrutura também mas enfim, é como se fosse a parte mais estrutural das análises de narrativa e a parte de benchmark é a parte de pesquisa basicamente onde a gente vai trazer vídeos canais, tudo que é relacionado a pesquisa de mercado, vamos dizer assim 

______
### benchmark_channels
Essa tabela é a tabela o nde a gente guarda os canais de referência Canais que a gente acredita que sejam bons, que valham a pena modelar 
______
### benchmark_channels_baseline_stats
Essa tabela tem relação com os benchmark channels e ela é que guarda as principais métricas para a gente calcular, que são utilizadas como base para a gente poder calcular o outlier score dos vídeos destes mesmos canais. É aqui que nós temos as médias, tudo que a gente pega e calcula usando o scraping do social blade, coisas do tipo, para dizer como é a média desse canal e como os vídeos que estão sendo postados nesse canal se comportam em relação à média, à mediana e coisas do tipo.

É aqui que a gente guarda esse tipo de informação. 

_____
### benchmark_channels_dossier
essa tabela aqui é onde a gente guarda o dossiê dos canais, o dossiê de análise narrativa dos canais. Para que isso serve? No fluxo do Brand Bible, de criação de canal novo, de toda a estratégia da bíblia de branding no canal, nós temos, a gente usa canais como referência.

Esses canais como referência, eles são analisados como? A gente monta esse tipo, dossiê de cada canal. Então se eu tenho 5 canais que eu gostaria de modelar, que falam sobre temas específicos, exemplo, histórias africanas Eu vou pegar 5 canais bombados de histórias africanas e vou gerar dossiê para cada deles Esse dossiê envolve várias coisas que a gente usa depois dentro do fluxo de Brand Bible, de criação disso daí 
______
### benchmark_channels_selected_niches
Essa tabela aqui, ela é uma tabela que a gente... É filtro de canais, onde a gente consegue visualizar canais, somente os canais que a gente selecionou os nichos, por exemplo. Eu tenho uma outra tabela. Eu tenho uma outra tabela chamada Structure Categorization. niches, e dentro dessa tabela, structure, underline, categorization, underline, niches, nós temos uma coluna chamada selected, que é booleana, é true ou false.

Aqui eu defino quais nichos eu quero monitorar, que eu quero ver no meu banco, por quê? Numa puxada de benchmark via API Vem muito canal lixo de outras coisas E aí é aqui nessa tabela que eu faço uma seleção Falo, olha, eu quero manter no meu banco Eu quero visualizar apenas os canais que estão nos nichos X, Y ou Z E ali eu marco True se o nicho for verdadeiro Essa tabela Structure Categorization Nishes É uma tabela de referência de nichos que a gente tem padronizada e ali que a gente coloca true ou false pra saber se a gente quer ver aquele nicho como nicho selecionado ou se ele pode ser descartado por exemplo, em umas automações de limpeza 
____________
### benchmark_outlier_videos
Essa view, benchmark, underline, outlier, underline, videos, são os vídeos mais bombados dentre todos que a gente coloca dentro da tabela benchmark videos. Aqui é como se fosse agrupamento de métricas e colunas da parte de vídeos, como também métricas e colunas da parte de canais. Os canais que são pais desses vídeos, vamos dizer assim São quem os hospeda, vamos dizer assim E aqui é uma junção dos dois Ali eu posso fazer filtro por categorização Eu posso fazer filtro pelo Outlier Score Então aqui é uma tabela mais filtrada para poder realmente pegar só a nata dos vídeos E eu coloquei algumas informações a mais misturando tabelas, por exemplo 

________
### benchmark_videos
Aqui, benchmark videos é a tabela onde a gente guarda todos os vídeos que a gente faz inserção no banco baseado em API ou manualmente, etc. Enfim, é uma tabela de vídeos pesquisados em busca de vídeos que estão bombados. Aqui pode ter tanto vídeos bons quanto vídeos ruins também. 

_______
### ddl_sync_queue
Essa é uma tabela onde a gente guarda todas as operações feitas, todas as modificações feitas na tabela no banco de dados para poder se encar numa automação que vai protocolar tudo isso no GitHub de forma automática. Então ele vai guardando todas as alterações, vai entendendo o que foi feito e protocola no GitHub. 

_____
### distribution_posting_queue
Essa tabela inicialmente ela foi criada para ser uma fila de saída Sabe quando você termina de produzir, agenda o vídeo e coloca ela tipo numa fila de saída Essa era a ideia, mas ele acaba que está bem parecido com a Production Videos Eu não sei bem da necessidade disso aqui agora 
_____
### narrative_analyses
Essa é a tabela onde a gente guarda todas as análises e narrativas de forma bem quebradinha. Sobre qual é a estrutura que está usando, estrutura de narrativa, qual é o core emocional da trama, tipo de conflito, a gente tem o tema central, os story beats, que é a parte mais importante.

Temos também toda a parte de story settings, que são, enfim, o setup da história, localização, pessoas, relação entre coisas do tipo e por aí vai, beleza? Enfim, análise narrativa é aqui que a gente guarda 
__________
### narrative_archetypes
### narrative_characters
### narrative_conflict_types
### narrative_emotional_cores
### narrative_structures

Essas tabelas, Narrative e Underline, Archetypes, Characters, Conflict Types, Emotional Cores, Structures, são as tabelas que são referenciadas na hora de fazer a análise narrativa. Então, elas guardam padrões de cada desses atributos e a Narrative e a Archetypes usa elas para referenciar. Então, vou dar exemplo. Narrative Structure, você vai ter ali Jornada do Herói Você vai ter Rags to Reaches Você vai ter vários tipos, Tragédia Tipos estruturais de arquétipos narrativos E ali na análise de narrativa Narrativa e análise, a gente menciona A gente quebra o roteiro que a gente está analisando Em diversos atributos, emocionais e tal E cada desses atributos é referenciado com o ID correspondente em sua tabela.

Então, essas são tabelas meio que auxiliares. 
________
### production_audio_segments
Essa tabela aqui é onde a gente guarda os segmentos de áudios de narração de TTS. 
São pequenos trechinhos de áudio que vão ser concatenados em áudios em segmentos maiores, que depois vão dar origem aos segmentos de vídeo quando forem unidos a imagens. 

_______
### production_concatenated_audios
Aqui é a tabela onde a gente tem os vídeos concatenados. O que os vídeos concatenados são? Cada API de geração de áudio, de narração de áudio, tem limite. Então pode ser que roteiro muito grande tenha que ser dividido em 30, 40 pequenos trechos de áudio narrado.

Só que trabalhar com 30, 40, 50 trechos de áudios narrados pequenininhos é ruim. Então a gente pega e reconcatena eles. Reconcatena não, a gente concatena pela primeira vez Por exemplo, eu vou ter 40 micro áudios, vamos dizer assim Trechinhos de narração Eu vou juntar, concatenar de 4 em 4 Para que eu tenha 10 segmentos de áudios concatenados Ao invés de trabalhar com 40, eu trabalho com 10 Então ele primeiro espalha para depois concatenar Espalha na hora de gerar a narração e depois ele concatena isso em trechos em áudios pouco maiores usando o FFmpeg é aqui que a gente guarda esses áudios 
__________
### production_covering_images
Essa é uma tabela que nós não estamos usando mais, mas poderemos usar, que guarda as imagens de cobertura do roteiro. vídeo, segmento de vídeo, ele é formado por imagens e áudio. Quando você junta os dois, você consegue montar vídeo, gerar vídeo. Aqui é onde a gente guarda a parte das imagens de cobertura dos vídeos. 
_____
### production_video_editing_assets
Essa é uma tabela que é a evolução da Covering Images. Por quê? Essa é a tabela que a gente pensou para ser os assets de cobertura do vídeo. O que eu quero dizer com isso? Aqui a gente coloca, é como se fosse uma timeline.

É como aqui tem todas as instruções de cada ativo, de cada pecinha, cada asset, que vai cobrir toda a timeline do vídeo, com suas minutagens de início, de fim, duração, tipo se é imagem, se é áudio, se é soundtrack, se é visual effects, se é teaser que vai entrar antes, ou seja, que é a cobertura da timeline de uma forma muito mais estratégica.

Então essa é uma tabela bem robusta com minutagens, com tudo, e a gente usa ela para poder direcionar o FFMPEG depois quando ele for gerar o vídeo. Ele precisa saber, cara, essa imagem vai de qual... Qual é a imagem que cobre os primeiros 5 segundos do vídeo? Tem teaser para entrar antes?

É isso aqui que ele vai usar para montar a timeline de edição dele. 

_________
### production_video_segments
Essa é a tabela onde a gente guarda os segmentos de vídeo. Lembrando, os segmentos de vídeo são áudio unidos a imagens. Então isso gera segmento de vídeo. É aqui que a gente guarda e monitora eles.

Faz parte da produção também. 

__________
### production_videos
Essa é a principal tabela do banco de dados, é onde a gente monitora, a gente controla toda a produção de vídeos, onde a gente vê tudo que vai ser produzido ou já foi produzido. 

___________
### structure_accounts
essa tabela onde a gente guarda, a gente protocola os dados mais... os dados mais burros do canal, vamos dizer assim. A gente está colocando nome, dados mais... descritivos, vamos dizer assim. Não sei bem se é essa palavra, mais credenciais, talvez, vai. A gente guarda o nome do canal, o channel ID, a linguagem, se ele está ativo ou não está, time zone, Nicho, subnicho, são coisas pouco mais travadas.

Depois ele faz referência, a coluna mais importante é a Brand ID, que ele faz referência à tabela de Brand Bible daquele canal. Então aqui a gente não vai colocar os dados, por exemplo, de estratégia do canal, estilo de escrita, estilo de narração, não tem nada disso aqui. Aqui é uma coisa mais mecânica, mais travada mesmo, é para protocolar os canais, para saber o placeholder, o ID, futuramente colocar a plataforma, por enquanto só tem YouTube, mas pode ter TikTok, Instagram, alguma coisa do tipo, é aqui que nós protocolamos as nossas contas, de propriedades nossas. 
______
### structure_allowed_status
Essa é a tabela com todos os status permitidos na nossa operação de produção de vídeos e o que significa cada deles. 
_______
### structure_api_keys_pool
Essa é a tabela onde a gente guarda chaves de API para fazer rotacionamento inteligente, para não gastar tudo em uma única chave de API. Então a gente protocola aqui no banco, a gente monta script seletor, geralmente, que consulta dessa tabela, e aqui a gente consegue não estourar o limite de uma API, ou testar várias APIs gratuitas para não ter que pagar serviços, e por aí vai.

Então a gente cria protocolo aqui E aí a gente consegue fazer uma escala Através do limite Gratuito das ferramentas 
___________
### structure_api_queue
essa é uma uma construção recente que é uma tabela onde a gente organiza toda a fila de produção de imagens de toda a máquina de produção de conteúdo é aqui que a gente protocola cada imagem que é solicitada a ser gerada e dependendo ali do canal dependendo da estratégia a gente seleciona provider de imagens poderia ser Gemini, poderia ser Runware poderia ser GPT, poderia ser qualquer, sei lá, mid-journey.

Aqui a ideia é a gente fazer o controle de fila assíncrona para que a gente consiga reprocessar a imagem. Estava dando muito problema de rate limit. Então a gente precisava controlar melhor essa fila de produção independente de qual canal, de qual vídeo, de qual motivo de produção de imagem.

Vou dar exemplo. A gente poderia ter imagem de cobertura, poderia ter retratos dos personagens, que são os portraits, a gente poderia ter a thumbnail, tudo a imagem entra na fila de produção. Isso aqui é o controle da fila de produção. 
__________
### structure_audio_assets
Essa é a tabela onde a gente guarda os assets de áudio, as músicas de fundo, coisas que a gente vai disponibilizar para randomização dos canais. Então a gente categoriza tudo direitinho e coloca aqui e em algum momento algum script seletor vai randomizar isso daqui e vai jogar na música de fundo de algum canal para poder gerar o vídeo e deixar ele mais harmonioso. 
_________
### structure_brand_bible
Essa é a tabela que é o coração da marca Quando a gente cria canal, a gente está criando uma marca Quando a gente dá Brand Bible para ele E aqui a gente contém todos os dados Cada canal tem seus dados de marca mesmo Uma bíblia de branding do canal Que é uma marca, na verdade Que poderia ter canal no Instagram Poderia ter canal no TikTok Poderia ter canal no YouTube Hoje a gente usa só no YouTube mas poderia ter mais plataformas e todas elas seguiriam a mesma Brand Bible, o mesmo manual de marca, onde nós vamos ter a estratégia, a audiência, se tem host no canal ou não tem nessa marca, o estilo de escrita, o estilo de voz, o estilo de imagem, então, cara, é manual de marca feito em colunas, com bastante JSONB. 

________
### structure_categorization_categories
### structure_categorization_formats
### structure_categorization_microniches
### structure_categorization_niches
### structure_categorization_subniches

essas tabelas são tabelas auxiliares para a gente conseguir convergir a categorização de canais e de vídeos. O que eu quero dizer com isso? Se eu deixo aberto, o que acontece? A gente não tem padronização.

Se eu não tenho padronização, eu não tenho match de vídeos com canais na hora de produzir. lá atrás na minha catraca virtual que vai me dizer para quais canais eu quero produzir determinado vídeo. Então é travando essas categorias, micronichos, nichos e subnichos, a gente consegue fazer match muito mais preciso, ainda que a gente, mais preciso não, mais confiável, mais consistente, ainda que eu abra mão de algum detalhamento.

A gente chegou a essa conclusão de que se pela natureza divergente da IA A gente jamais conseguiria chegar em uma categorização consistente Em match consistente entre vídeo e canal, beleza? Então essas são as tabelas que seguram os valores permitidos Para poder colocar lá no nosso JSONB de categorization de vídeos e canais 

____________
### structure_credentials
Aqui, essa tabela é a tabela onde a gente guarda as credenciais de cada canal. Aí a gente coloca, por exemplo, credenciais, qual que é a API, o token de API, o refresh token, o access token, várias coisas que a gente guarda para poder fazer todas as conexões com plataformas principais funcionarem para cada canal. ela está sendo utilizada especialmente para garantir que a API do YouTube consiga ter as credenciais de cada dos canais de forma dinâmica para subir os seus vídeos sem problema nenhum 
___________
### structure_platform_posting_config
Essa é a tabela que define quantos slots de postagem eu teria para cada plataforma. Isso não está sendo tão utilizado para TikTok e Instagram, óbvio, porque não tem nenhum conteúdo sendo produzido ainda na máquina de conteúdos para esses canais, para essas plataformas. mas ela define bem para o YouTube, por exemplo, como que vai ser a configuração de slots de postagem do YouTube.

Deixa eu explicar pouco melhor. Aqui a gente pode ter, a gente definiu que nem o horário de postagem a gente queria definir, isso teria que ser automático. Então o que eu fiz? Eu travei valor de, sei lá, 6 da manhã até as 22 horas para postar e eu subdividi esse horário em slots de 5 minutos, totalizando 192 slots disponíveis para postagem.

E aí, aqui é onde eu defino a quantidade de slots direitinho para cada plataforma. Mas basicamente nós só estamos usando o YouTube. E aí o que acontece? Depois a gente vai ter uma outra tabela que é a Posting Slots, onde nós vamos escolher em qual slot de postagem cada canal vai estar.

O que eu quero dizer com isso? eu posso selecionar canal o canal 1 esse canal 1 ele vai ter o slot de postagem todos os dias ele vai postar 7 horas da manh aquele slot tá travado pra ele, então todo dia 7 da manhã, se tiver vídeo ele vai postar nesse horário, vai ser agendado nesse horário pra aquele canal e aí, esses slots, dependendo da quantidade, da minutagem de tempo de intervalo que eu tenho de ao outro a gente vai ter, por exemplo se o intervalo for de 5 minutos a gente pode ter 192 slots de postagem então eu poderia teoricamente ter 192 canais postando ali, de forma organizada então, por exemplo é como se fosse uma grade travada de postagem onde cada canal, assim como o programa de televisão tem cada programa de televisão tem uma grade travada que vai rodar sempre no mesmo horário o Jornal Nacional rola sempre às 20 horas a novela sempre às 21 Eu não invento moda Aqui a mesma ideia é os canais O canal X posta às 7 horas O canal Y posta às 7 e 5 O canal Z posta às 7 e 10 O canal W posta às 8 e 5 O canal, sei lá, XPTO posta às 8 e 35 E todo dia ele segue essa regra de grade Que é definido Então aqui nesse Posting Slot Config eu estou configurando quantos slots terão disponíveis para postagem.

E aí eu vou falar da próxima tabela agora para você entender como ela se complementa. 
________
### structure_posting_slots
Aqui na Posting Slots é onde a gente define de fato qual canal pega qual slot na janela na grade de programação de postagens. É aqui que a gente define através do placeholder do canal, por exemplo, quem vai postar a 7, quem vai postar a 5 e por aí vai.

E eu posso ter mais de slot tomado pelo mesmo canal. Por quê? Porque eu posso ter uma frequência de postagem diferente entre os canais. eu posso ter canal que posta três vezes por dia, às sete, ao meio-dia e meia e às 19h05, por exemplo. É só eu chegar aqui e colocar quais slots aquele canal ocupa, vamos dizer assim, na grade de programação dos canais. 
___________
### structure_production_workflow
Essa tabela é uma configuração que está indo dentro da Brand Bible, uma tabela auxiliar que é referenciada lá na Brand Bible, que define mais ou menos qual que vai ser o fluxo de produção escolhido para cada canal. O que eu quero dizer com isso? A gente pode ter fluxo de produção para vídeos de saúde, fluxo de produção para vídeos bíblicos, fluxo de produção para vídeos de história, e eles têm pequenas mudanças, tanto na parte de roteirização, quanto na parte de análise, quanto na parte de cobertura de imagens.

São nichos diferentes de mercado, desenvolvidos com sofisticações diferentes no YouTube. Então pode ser que o nicho seja mais concorrido, e ele já esteja, por exemplo, cobrindo o vídeo inteiro com IA não só com imagens, então isso requer fluxo de produção diferente em alguns momentos da nossa máquina então é aqui que nós travamos alguns perfis de produção para que a gente consiga direcionar, cada canal vai usar perfil de produção diferente para travar esse perfil de produção esse workflow de produção 
_________
### structure_prompt_templates
Essa tabela não está sendo tão utilizada mais, a ideia dela era tornar fluxo completamente agnóstico e ele sempre puxar quais agentes aquele fluxo de produção usaria puxando direto no banco. Ou seja, se eu tivesse diferentes estilos de produção, prompts de roteiristas, prompts de polidores, prompts diferentes de agentes diferentes para diferentes fluxos de produção, ele puxaria na hora que ele fosse executar, lá no fluxo do N8N.

E aqui eu estava colocando os prompts, os user inputs, mas chegou a funcionar, só que isso dá muito trabalho para renderizar as variáveis dentro do N8N puxando do banco. Enfim, não usa mais Melhor fazer fluxos separados do que Tentar transformar o sistema todo em coisas dinâmicas 
___________
### structure_ssml_lexicons
Essa tabela também não está sendo mais utilizada, ela era quando a gente moldava a narração usando SSML. A gente já trazia alguns padrões de SSML aqui para facilitar, mas isso aqui não está sendo utilizado mais, não tem necessidade. 
_______
### structure_video_editing_styles
Então, essa coluna aqui, eu não sei se ela está sendo utilizada ou bem utilizada, porque ela define os estilos de edição dos diferentes canais. Então, cada canal tem estilo de edição. canal bíblico vai ter estilo de edição, canal de histórias vai ter outro, canal de curiosidades vai ter outro estilo. e aqui que a gente estava travando isso, mas eu não sei o quão bem ou sequer se o FFM pegue na hora de gerar o seu script de edição está utilizando alguma coisa daqui.

Então vale rever a utilidade dessa tabela, até porque só tem estilo de edição ali e não acho que esteja mudando nada isso aqui. A ideia é boa, mas a execução foi uma bosta. 
________
### structure_video_inserts
essa tabela é uma tabela crucial para a gente poder garantir inserções no nosso vídeo. A ideia dela é boa, ela não está sendo utilizada ainda, porque ela teria que entrar na minha visão lá na Production Video Editing Assets, que seria todos os assets de cobertura de vídeo. É o manual de edição daquele vídeo, vamos dizer. com todas as minutagens e qual asset vai de qual segundo até qual segundo, qual a duração dele e por aí vai.

Esses inserts, eles seriam, por exemplo, os calls to action para vender, para se inscrever, calls to action para comprar produtos digitais, vídeos de vendas, inserções que eu gostaria de colocar no meu vídeo. Então, por exemplo, eu posso gerar vídeos com IA ou gravar vídeos e dizer, cara, esse vídeo vai entrar na minutagem 3 minutos até o 3 minutos e 35 segundos e vai exibir essa peça de vídeo no meio do vídeo aqui.

Assim como uma propaganda tem inserção num programa de televisão, aqui seria onde a gente guardaria esses diferentes video inserts. Então, exemplo, eu vou ter video insert para introdução, eu vou ter video insert para poder chamar uma pessoa para se inscrever no canal, se eu estou promovendo uma campanha específica de produto digital ou de suplemento, qualquer coisa que eu queira vender no meu vídeo.

Eu posso criar vídeo específico e colocar aqui, pra ele entrar no meio da edição de vídeo. Então aqui é onde a gente guarda esses ativos de vídeo inserts. É banco de vídeo inserts aqui que a gente teria. 
_______
### structure_video_rendering_profiles
Cara, essa tabela é uma tabela onde a gente guarda perfis técnicos de edição de vídeo Com parâmetros que a gente vai colocar dentro do FFMPEG Então é bem travado mesmo A gente pode criar diferentes padrões Assim como a gente escolhe na hora de programa de edição e coloca eu quero uma edição mais rápida, com menos qualidade Uma edição mais detalhada, que demora mais para renderizar Então esses são os parâmetros que ele carrega no sistema na hora que ele vai renderizar 
_______
### structure_visual_fx
Essa é a tabela onde a gente guarda, é banco de efeitos visuais. Aqui tem as máscaras e tudo mais. Quando a gente decide cobrir vídeo com máscara, efeitos, etc. São os efeitos visuais, o Visual Effects. 
_______
### structure_workflow_pool
Essa tabela é uma tabela análoga ao pool de API keys. Aqui a gente tem pool de workflows do N8N que a gente usa para paralelizar a execução de algum processo que pode ser mais rapidamente feito quando é paralelizado. Entretanto, eu não sei se vale a pena usar isso aqui mais, porque eu descobri que você pode usar o mesmo workflow e só abrir novas threads.

Então, achava que tinha que criar diferentes workflows para fazer isso. Foi o que a documentação do N8N deu a entender na época. Então, mantém, mas eu acho que ela não vai ter tanta utilidade se a gente reformular todos os fluxos do N8N para poder rodar de uma forma mais inteligente. 
_________
