const firebaseConfig={
apiKey:"AIzaSyDta-NeJnd-9IVVjsJWE-VF1CYwm1FLK9c",
authDomain:"deliciacity-df6cf.firebaseapp.com",
databaseURL:"https://deliciacity-df6cf-default-rtdb.firebaseio.com",
projectId:"deliciacity-df6cf"
};

firebase.initializeApp(firebaseConfig);

const auth=firebase.auth();
const db=firebase.database();

const ADMIN_EMAIL="admin@admin.com";

let uid=null;
let dados=[];
let grafico=null;

const formatarMoeda=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);

function tema(){
document.body.classList.toggle("dark");
localStorage.setItem("tema",document.body.classList.contains("dark")?"dark":"light");
}

auth.onAuthStateChanged(user=>{

if(user){

uid=user.uid;

emailUser.innerText=user.email;

login.classList.add("hidden");
app.classList.remove("hidden");

if(user.email===ADMIN_EMAIL){
adminPanel.classList.remove("hidden");
}

carregarDados();

}else{

login.classList.remove("hidden");
app.classList.add("hidden");

}

});

function login(){

const email=email.value;
const senha=document.getElementById("senha").value;

auth.signInWithEmailAndPassword(email,senha)
.catch(e=>alert(e.message));

}

function registrar(){

const email=document.getElementById("email").value;
const senha=document.getElementById("senha").value;

auth.createUserWithEmailAndPassword(email,senha)
.catch(e=>alert(e.message));

}

function logout(){

auth.signOut();
location.reload();

}

function carregarDados(){

db.ref("dados/"+uid).on("value",snap=>{

dados=[];

lista.innerHTML="";

let totalReceita=0;
let totalGasto=0;

snap.forEach(i=>{

let d=i.val();
let key=i.key;

dados.push({...d,key});

let li=document.createElement("li");

li.innerHTML=`
<span>
${d.descricao||""} | ${d.data}
${d.tipo==="gasto"?'-':'+'}
${formatarMoeda(d.valor)}
</span>

<button class="del" onclick="deletar('${key}')">🗑</button>
`;

lista.appendChild(li);

if(d.tipo==="receita") totalReceita+=d.valor;
else totalGasto+=d.valor;

});

totalReceita.innerText=formatarMoeda(totalReceita);
totalGasto.innerText=formatarMoeda(totalGasto);
saldo.innerText=formatarMoeda(totalReceita-totalGasto);

atualizarGrafico();

});

}

function addReceita(){

let valor=Number(receitaValor.value);
let desc=receitaDesc.value||"Receita";

if(!valor) return alert("Digite valor");

db.ref("dados/"+uid).push({

tipo:"receita",
valor:valor,
descricao:desc,
data:new Date().toLocaleDateString()

});

receitaValor.value="";
receitaDesc.value="";

}

function addGasto(){

let valor=Number(gastoValor.value);
let desc=gastoDesc.value||"Gasto";
let cat=categoria.value;

if(!valor) return alert("Digite valor");

db.ref("dados/"+uid).push({

tipo:"gasto",
valor:valor,
descricao:desc,
categoria:cat,
data:new Date().toLocaleDateString()

});

gastoValor.value="";
gastoDesc.value="";

}

function deletar(key){

if(!confirm("Deseja excluir?")) return;

db.ref("dados/"+uid+"/"+key).remove();

}

function atualizarGrafico(){

let categorias={};

dados.forEach(d=>{

if(d.tipo==="gasto"){
categorias[d.categoria]=(categorias[d.categoria]||0)+d.valor;
}

});

if(grafico) grafico.destroy();

grafico=new Chart(grafico,{
type:"pie",
data:{
labels:Object.keys(categorias),
datasets:[{data:Object.values(categorias)}]
}
});

}

function filtrarMes(){

let mes=filtroMes.value;

lista.innerHTML="";

dados.forEach(d=>{

let m=new Date(d.data).getMonth();

if(mes!=="todos" && m!=mes) return;

let li=document.createElement("li");

li.innerHTML=`
<span>${d.descricao} | ${d.data} ${formatarMoeda(d.valor)}</span>
`;

lista.appendChild(li);

});

}

function exportarCSV(){

let csv="Tipo,Descricao,Valor,Data\n";

dados.forEach(d=>{
csv+=`${d.tipo},${d.descricao},${d.valor},${d.data}\n`;
});

let blob=new Blob([csv]);

let a=document.createElement("a");

a.href=URL.createObjectURL(blob);
a.download="extrato.csv";

a.click();

}

function carregarAdmin(){

let users=0;
let transacoes=0;
let valor=0;

db.ref("dados").once("value",snap=>{

snap.forEach(u=>{

users++;

u.forEach(t=>{

let d=t.val();

transacoes++;
valor+=d.valor;

});

});

adminUsers.innerText=users;
adminTransacoes.innerText=transacoes;
adminValor.innerText=formatarMoeda(valor);

});

}