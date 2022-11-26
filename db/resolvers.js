const Usuario = require('../models/Usuario')
const Proyecto = require('../models/Proyecto')
const Tarea = require('../models/Tarea')
const bcryptsjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config({path: 'variables.env'})
//crear y firma un jwt 

const crearToken = (usuario, secreto, expiresIn)=>{
    
    const {id, email, nombre} = usuario
    
    return jwt.sign({id,email, nombre}, secreto, {expiresIn})
}

const resolvers = {
    Query: {
        obtenerProyectos: async (_, {}, ctx)=>{
            const proyectos = await Proyecto.find({creador: ctx.usuario.id})

            return proyectos; 
        }, 
        obtenerTareas: async (_, {input}, ctx)=>{ 
            const tareas = await Tarea.find({creador: ctx.usuario.id}).where('proyecto').equals(input.proyecto);
            return tareas
        }
    }, 
    Mutation: {
        crearUsuario: async (_,{input})=>{
            const {email, password} = input
            
            const existeUsuario = await Usuario.findOne({email}); 

            //si existe usuario 
            if(existeUsuario){
                throw new Error('El usuario ya está registrado')
            }

            try {

                // Hashear passoword 

                const salt= await bcryptsjs.genSalt(10)
                input.password = await bcryptsjs.hash(password, salt)

                //registrar nuevo usuario
                const nuevoUsuario = new Usuario(input)

                nuevoUsuario.save();
                return "Usuario creado correctamente"
            } catch (error) {
                console.log(error)
            }
        }, 
        autenticarUsuario: async (_, {input})=>{
            const {email,password} = input

            // si el usuario existe 

            const existeUsuario = await Usuario.findOne({email})
            if(!existeUsuario){
                throw new Error('El usuario no existe')
            }
            // si el password es correcto 
            const passwordCorrecto = await bcryptsjs.compare(password, existeUsuario.password)

            if(!passwordCorrecto){
                throw new Error('Password Incorrecto')
            }

            // dar acceso a la app

            return { 
                token: crearToken(existeUsuario, process.env.SECRETO, '4hr')
            }
        }, 
        nuevoProyecto: async (_, {input}, ctx)=>{
            
            try {
                const proyecto = new   Proyecto(input)

                //asociar el creador 
                proyecto.creador = ctx.usuario.id
                const resultado = await proyecto.save()
                return resultado
            } catch (error) {
                console.log(error)
            }
        }, 
        actualizarProyecto: async (_,{id, input}, ctx)=>{
            //revisar si el proyecto existe o no 
            let proyecto = await Proyecto.findById(id); 

            if(!proyecto){
                throw new Error('Proyecto no encontrado')
            }
            
            //revisar que si la personas que trata de editarlo es el creador 
            if(proyecto.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales para editar')
            }

            //guardar el proyecto
            proyecto = await Proyecto.findOneAndUpdate({_id: id}, input, {new: true})

            return proyecto
        }, 
        eliminarProyecto: async (_, {id}, ctx)=>{
            //revisar si el proyecto existe o no 
            let proyecto = await Proyecto.findById(id); 

            if(!proyecto){
                throw new Error('Proyecto no encontrado')
            }
            
            //revisar que si la personas que trata de editarlo es el creador 
            if(proyecto.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales para editar')
            }

            //eliminar 
            await Proyecto.findOneAndDelete({_id: id})

            return "Proyecto eliminado"
        }, 
        nuevaTarea: async (_,{input}, ctx)=>{
            try {
                const tarea = new Tarea(input)
                tarea.creador = ctx.usuario.id

                const resultado = await tarea.save()

                return resultado
            } catch (error) {
                console.log(error)
            }
        }, 
        actualizarTarea: async (_, {id, input, estado}, ctx)=>{
            //si la tarea existe o no 

            let tarea = await Tarea.findById(id)

            if(!tarea){ 
                throw new Error('Tarea no encontrada')
            }

            //si la pesronas que edita es el creador 
            if(tarea.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales para editar!')
            }

            // asignar estado 
            input.estado = estado

            //guardar y retornar tarea

            tarea = await Tarea.findOneAndUpdate({_id: id}, input, {new: true})

            return tarea
        }, 
        eliminarTarea: async (_,{id}, ctx)=>{ 
            //revisar si la tarea existe
            let tarea = await Tarea.findById(id)

            if(!tarea){ 
                throw new Error('Tarea no encontrada')
            }

            //revisar si es el autor quien esta eliminando 
            if(tarea.creador.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales para editar!')
            }


            //eliminar 

            await Tarea.findOneAndDelete({_id: id})

            return "Tarea Eliminada"
        }
        
    }
}

module.exports = resolvers; 